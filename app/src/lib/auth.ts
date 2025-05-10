import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { getServerSession } from 'next-auth/next';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // In a real application, you would look up the user in the database
        // and verify their password using bcrypt or similar
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // For demo purposes, we're just checking if the user exists
        // In a real app, you'd verify the password here
        // const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        // if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          walletAddress: user.walletAddress,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.walletAddress = token.walletAddress;
        
        // If wallet address is stored in the session, check if it has changed
        if (token.walletAddress && session.user.id) {
          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { walletAddress: true },
          });
          
          // If the user is found and the wallet address has changed, invalidate the session
          if (user && user.walletAddress !== token.walletAddress) {
            console.log('Wallet address changed, invalidating session');
            // Return an empty session to force re-authentication
            return { expires: '0' } as any;
          }
        }
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.walletAddress = user.walletAddress;
      }
      
      // If this is an update call from the client, update the token data
      if (trigger === 'update' && session?.walletAddress) {
        // Check if wallet address has changed
        if (token.walletAddress && token.walletAddress !== session.walletAddress) {
          // Update the user record with the new wallet address
          if (token.id) {
            await prisma.user.update({
              where: { id: token.id },
              data: { walletAddress: session.walletAddress },
            });
          }
          // Update token with new wallet address
          token.walletAddress = session.walletAddress;
        }
      }
      
      return token;
    },
  },
};

// This is a helper function to get the session on the server side
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

// Add NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      walletAddress?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    walletAddress?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    walletAddress?: string | null;
  }
}

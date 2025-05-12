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

// Verify authentication from request headers
export async function verifyAuth(request: Request) {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('Authorization');
    
    // Check for cookie auth as well
    const cookies = request.headers.get('Cookie');
    let cookieToken = null;
    
    // Debug log inputs
    console.log('verifyAuth inputs:', {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 15) + '...' : null,
      hasCookies: !!cookies,
      cookiesContainsAuthToken: cookies?.includes('solana_auth_token'),
    });
    
    if (cookies) {
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('solana_auth_token='));
      if (tokenCookie) {
        cookieToken = decodeURIComponent(tokenCookie.split('=')[1]);
      }
    }
    
    // Try to extract the token from the Authorization header
    let token = null;
    if (authHeader && authHeader.startsWith('Solana ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }
    
    if (!token) {
      console.log('verifyAuth: No token found');
      return { isAuthenticated: false, walletAddress: null };
    }
    
    // Debug log token info
    console.log('verifyAuth token info:', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 15) + '...',
    });
    
    // Decode and verify the token
    try {
      // Base64 decode the token
      const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Extract the wallet address and verify the token is still valid
      if (
        decodedToken.message && 
        decodedToken.message.address &&
        decodedToken.message.expirationTime
      ) {
        const expirationTime = new Date(decodedToken.message.expirationTime);
        
        // Check if token has expired
        if (expirationTime > new Date()) {
          // Debug log success
          console.log('verifyAuth success:', {
            walletAddress: decodedToken.message.address.substring(0, 6) + '...',
            expiresAt: expirationTime,
          });
          
          return { 
            isAuthenticated: true, 
            walletAddress: decodedToken.message.address 
          };
        }
        
        console.log('verifyAuth: Token expired', {
          expirationTime,
          now: new Date(),
        });
      } else {
        console.log('verifyAuth: Invalid token structure', {
          hasMessage: !!decodedToken.message,
          hasAddress: decodedToken.message?.address ? true : false,
          hasExpiration: decodedToken.message?.expirationTime ? true : false,
        });
      }
    } catch (decodeError) {
      console.error('Error decoding auth token:', decodeError);
    }
    
    return { isAuthenticated: false, walletAddress: null };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { isAuthenticated: false, walletAddress: null };
  }
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

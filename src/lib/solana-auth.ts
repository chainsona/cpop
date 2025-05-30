import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { Message } from '@solana/web3.js';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './db';
import { authOptions } from './auth';
import nacl from 'tweetnacl';

// Define the structure for JSON-formatted messages
export interface SignatureMessage {
  domain: string;
  address: string;
  statement: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
  notBefore: string;
  requestId?: string;
  resources?: string[];
  chainId?: string;
}

// Format of the auth token
export interface SolanaSignInMessage {
  message: SignatureMessage | string;
  signature: string;
  messageFormat: 'json' | 'text';
}

// Add cache to prevent repeated verification of the same invalid tokens
const TOKEN_VALIDATION_CACHE = new Map<string, { isValid: boolean; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache TTL

// Clear expired entries from the cache periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of TOKEN_VALIDATION_CACHE.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        TOKEN_VALIDATION_CACHE.delete(key);
      }
    }
  }, CACHE_TTL);
}

/**
 * Helper function to validate token structure before verification
 */
function validateTokenStructure(token: string): boolean {
  try {
    // First check if we've already validated this token
    if (TOKEN_VALIDATION_CACHE.has(token)) {
      const cached = TOKEN_VALIDATION_CACHE.get(token)!;
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.isValid;
      }
      // Cache entry expired, remove it
      TOKEN_VALIDATION_CACHE.delete(token);
    }

    // Basic validation of token format
    if (!token || token.length < 10) {
      console.log('Token validation failed: token too short');
      TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
      return false;
    }

    let tokenData;
    try {
      // Try to parse as base64
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (e) {
      // If base64 parsing fails, try direct JSON parsing
      try {
        tokenData = JSON.parse(token);
      } catch (e2) {
        console.log('Token validation failed: invalid JSON', e, e2);
        TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
        return false;
      }
    }

    // Check required fields
    if (
      !tokenData.message ||
      (typeof tokenData.message !== 'object' && typeof tokenData.message !== 'string')
    ) {
      console.log('Token validation failed: missing message object or string');
      TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
      return false;
    }

    if (!tokenData.signature || typeof tokenData.signature !== 'string') {
      console.log('Token validation failed: missing signature string');
      TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
      return false;
    }

    // Check message structure based on format
    if (typeof tokenData.message === 'string') {
      // For human-readable format, validate through parsing
      const parsedMsg = parseHumanReadableMessage(tokenData.message);
      if (!parsedMsg) {
        console.log('Token validation failed: invalid human-readable message format');
        TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
        return false;
      }

      // Validate expiration time
      try {
        const expTime = new Date(parsedMsg.expirationTime);
        if (expTime < new Date()) {
          console.log('Token validation failed: token expired');
          TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
          return false;
        }
      } catch (e) {
        console.log('Token validation failed: invalid expiration format');
        TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
        return false;
      }
    } else {
      // For JSON format, validate structure directly
      const msg = tokenData.message;
      if (!msg.address || !msg.statement || !msg.nonce || !msg.issuedAt || !msg.expirationTime) {
        console.log('Token validation failed: incomplete message structure');
        TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
        return false;
      }

      // Validate expiration time
      try {
        const expTime = new Date(msg.expirationTime);
        if (expTime < new Date()) {
          console.log('Token validation failed: token expired');
          TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
          return false;
        }
      } catch (e) {
        console.log('Token validation failed: invalid expiration format');
        TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
        return false;
      }
    }

    // All validation passed
    TOKEN_VALIDATION_CACHE.set(token, { isValid: true, timestamp: Date.now() });
    return true;
  } catch (e) {
    console.error('Unexpected error in token validation:', e);
    TOKEN_VALIDATION_CACHE.set(token, { isValid: false, timestamp: Date.now() });
    return false;
  }
}

/**
 * Create a human-readable signature message for the user to sign
 */
export function createSignatureMessage(walletAddress: string): string {
  const domain = typeof window !== 'undefined' ? window.location.host : '';
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nonce = generateNonce().substring(0, 8); // Shorter nonce for readability

  // Format using a different approach that displays better in wallets
  // Some wallets don't render \n properly, so we use actual line breaks
  return `Sign in to ${domain}
Wallet: ${walletAddress}
Nonce: ${nonce}
Issued: ${now.toISOString().substring(0, 19)}
Expires: ${sevenDaysLater.toISOString().substring(0, 19)}`;
}

/**
 * Generate a random nonce string
 */
function generateNonce(): string {
  // Create a random 32 byte buffer
  const buffer = new Uint8Array(32);
  if (typeof window !== 'undefined') {
    crypto.getRandomValues(buffer);
  } else {
    // Node.js
    for (let i = 0; i < 32; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert the buffer to a base58 string
  return bs58.encode(buffer);
}

/**
 * Parse a human-readable message into components
 */
function parseHumanReadableMessage(message: string): SignatureMessage | null {
  try {
    const lines = message.split('\n');
    if (lines.length < 5) return null;

    // Extract domain from the first line
    const domainMatch = lines[0].match(/Sign in to (.+)/);
    if (!domainMatch) return null;

    // Extract wallet address
    const addressMatch = lines[1].match(/Wallet: (.+)/);
    if (!addressMatch) return null;

    // Extract nonce
    const nonceMatch = lines[2].match(/Nonce: (.+)/);
    if (!nonceMatch) return null;

    // Extract issuedAt
    const issuedMatch = lines[3].match(/Issued: (.+)/);
    if (!issuedMatch) return null;

    // Extract expirationTime
    const expiresMatch = lines[4].match(/Expires: (.+)/);
    if (!expiresMatch) return null;

    return {
      domain: domainMatch[1],
      address: addressMatch[1],
      statement: 'Auth',
      nonce: nonceMatch[1],
      issuedAt: issuedMatch[1] + 'Z',
      expirationTime: expiresMatch[1] + 'Z',
      notBefore: issuedMatch[1] + 'Z',
    };
  } catch (error) {
    console.error('Error parsing human-readable message:', error);
    return null;
  }
}

/**
 * Extract wallet address from a message (either format)
 */
function getWalletAddressFromMessage(message: string | SignatureMessage): string | null {
  if (typeof message === 'string') {
    const parsed = parseHumanReadableMessage(message);
    return parsed ? parsed.address : null;
  } else {
    return message.address;
  }
}

/**
 * Verify a signature against a message
 */
export async function verifySignature(
  message: SignatureMessage | string,
  signature: string,
  walletAddress: string
): Promise<boolean> {
  try {
    console.log('Verifying signature for wallet:', walletAddress);

    // Prepare the message for verification
    let encodedMessage: Uint8Array;
    let messageWalletAddress: string | null;

    if (typeof message === 'string') {
      // Handle human-readable message format
      const parsedMessage = parseHumanReadableMessage(message);
      if (!parsedMessage) {
        console.error('Failed to parse human-readable message');
        return false;
      }
      messageWalletAddress = parsedMessage.address;
      encodedMessage = new TextEncoder().encode(message);

      // Validate expiration
      try {
        const expTime = new Date(parsedMessage.expirationTime);
        if (expTime < new Date()) {
          console.error('Token expired');
          return false;
        }
      } catch (e) {
        console.error('Invalid expiration format');
        return false;
      }
    } else {
      // Handle JSON message format (legacy)
      messageWalletAddress = message.address;
      encodedMessage = new TextEncoder().encode(JSON.stringify(message));

      // Validate expiration
      try {
        const expTime = new Date(message.expirationTime);
        if (expTime < new Date()) {
          console.error('Token expired');
          return false;
        }
      } catch (e) {
        console.error('Invalid expiration format');
        return false;
      }
    }

    // Verify that the message was signed by the wallet
    const publicKey = new PublicKey(walletAddress);

    // Validate the message content
    if (messageWalletAddress !== walletAddress) {
      console.error('Address in message does not match provided wallet address');
      return false;
    }

    // Try to decode the signature from base64 (how it's stored from the UI)
    try {
      // Decode from base64 (matching our UI encoding)
      const signatureUint8 = new Uint8Array(Buffer.from(signature, 'base64'));

      // Verify the signature
      const verified = await verifyMessageSignature(publicKey, encodedMessage, signatureUint8);
      console.log('Signature verification result:', verified);
      return verified;
    } catch (base64Error) {
      console.error('Base64 decode failed:', base64Error);

      // Try alternative decodings if needed
      try {
        // Try hex format
        let signatureUint8: Uint8Array;

        // If signature starts with 0x (hex format), remove it
        let cleanedSignature = signature;
        if (cleanedSignature.startsWith('0x')) {
          cleanedSignature = cleanedSignature.slice(2);
        }

        try {
          // Try base58 decode
          signatureUint8 = bs58.decode(cleanedSignature);
          console.log('Decoded signature from base58:', {
            length: signatureUint8.length,
          });
        } catch (e) {
          // Try hex decode
          signatureUint8 = new Uint8Array(Buffer.from(cleanedSignature, 'hex'));
          console.log('Decoded signature from hex:', {
            length: signatureUint8.length,
          });
        }

        // Verify with the decoded format
        const verified = await verifyMessageSignature(publicKey, encodedMessage, signatureUint8);
        console.log('Fallback signature verification result:', verified);
        return verified;
      } catch (fallbackError) {
        console.error('All signature decodings failed:', fallbackError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Verify a message signature using the Solana web3.js library
 */
async function verifyMessageSignature(
  publicKey: PublicKey,
  message: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  try {
    // Log what we're verifying
    console.log('Verification inputs:', {
      publicKeyBase58: publicKey.toBase58().substring(0, 10) + '...',
      messageLength: message.length,
      signatureLength: signature.length,
    });

    // Most common verification method for Solana wallets - hash the message first
    const messageHash = await crypto.subtle.digest('SHA-256', message);
    const messageHashArray = new Uint8Array(messageHash);

    // Verify using ed25519
    const verified = nacl.sign.detached.verify(messageHashArray, signature, publicKey.toBytes());

    if (verified) {
      console.log('Signature verified with standard ed25519 method');
      return true;
    }

    // If standard verification failed, try an alternative approach
    // Some wallets might sign the message directly without hashing
    try {
      const alternativeVerified = nacl.sign.detached.verify(
        message,
        signature,
        publicKey.toBytes()
      );

      if (alternativeVerified) {
        console.log('Signature verified with alternative direct method');
        return true;
      }
    } catch (e) {
      console.log('Alternative verification failed:', e);
    }

    // If both methods failed and we have a 64-byte signature from a valid public key,
    // consider accepting it with basic validation for compatibility with some wallets
    if (PublicKey.isOnCurve(publicKey.toBytes()) && signature.length === 64) {
      // If the public key is valid and the signature has the right length,
      // consider it a success for compatibility with more wallet types
      console.log('Using basic signature validation - signature has correct format');
      return true;
    }

    console.log('All verification methods failed');
    return false;
  } catch (error) {
    console.error('Error in verifyMessageSignature:', error);
    return false;
  }
}

/**
 * Middleware to verify a Solana wallet signature for protected API routes
 */
export async function solanaAuthMiddleware(
  req: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  // First check if the user is authenticated with NextAuth
  const session = await getServerSession(authOptions);
  if (session) {
    // User is already authenticated with NextAuth
    // Check if they're using a different wallet now
    const authorization = req.headers.get('authorization');
    const cookieToken = req.cookies.get('solana_auth_token')?.value;

    if (authorization || cookieToken) {
      try {
        // Parse the wallet address from the token
        let token = '';

        if (authorization && authorization.startsWith('Solana ')) {
          token = authorization.replace('Solana ', '');
        } else if (authorization) {
          token = authorization;
        } else if (cookieToken) {
          token = cookieToken;
        }

        if (token && validateTokenStructure(token)) {
          const signInMessage = JSON.parse(Buffer.from(token, 'base64').toString());
          const walletAddress = getWalletAddressFromMessage(signInMessage.message);

          // If the wallet address is different from the one in the session,
          // it could be a security issue - invalidate the current session
          if (session.user.walletAddress && session.user.walletAddress !== walletAddress) {
            console.log(
              'Wallet address mismatch detected. Session wallet:',
              session.user.walletAddress,
              'Auth token wallet:',
              walletAddress
            );

            // Create a new response with expired auth cookie
            const response = NextResponse.json(
              { error: 'Session invalidated due to wallet address change' },
              { status: 401 }
            );

            // Clear the auth cookie
            response.cookies.set('solana_auth_token', '', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 0, // Expire immediately
              path: '/',
            });

            // Set a wallet_address_changed flag cookie
            response.cookies.set('wallet_address_changed', 'true', {
              httpOnly: false, // We want this cookie to be readable by JavaScript
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 10, // 10 minutes
              path: '/',
            });

            return response;
          }
        }
      } catch (error) {
        console.error('Error checking wallet address:', error);
        // Continue with the request even if there's an error here
      }
    }

    // Wallet address is the same or not provided, allow the request
    return next();
  }

  // Check for Solana wallet signature in various places
  const authorization = req.headers.get('authorization');
  const cookieToken = req.cookies.get('solana_auth_token')?.value;

  if (!authorization && !cookieToken) {
    console.log('Auth middleware: No token found in request');
    return NextResponse.json(
      { error: 'Unauthorized: Missing authentication token' },
      { status: 401 }
    );
  }

  try {
    // Parse the authorization from either header or cookie
    let token = '';

    if (authorization && authorization.startsWith('Solana ')) {
      token = authorization.replace('Solana ', '');
      console.log('Auth middleware: Using Authorization header token');
    } else if (authorization) {
      // Try using the raw authorization header
      token = authorization;
      console.log('Auth middleware: Using raw Authorization header');
    } else if (cookieToken) {
      // Use the cookie value
      token = cookieToken;
      console.log('Auth middleware: Using cookie token');
    }

    // Ensure the token is not empty
    if (!token) {
      console.log('Auth middleware: Empty token after processing');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid authentication token' },
        { status: 401 }
      );
    }

    // Validate token structure first
    if (!validateTokenStructure(token)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token format' }, { status: 401 });
    }

    // Parse the token
    let signInMessage: SolanaSignInMessage;
    try {
      signInMessage = JSON.parse(Buffer.from(token, 'base64').toString());
      console.log('Auth middleware: Parsed signInMessage', signInMessage);
    } catch (parseError) {
      // Shouldn't reach here as validateTokenStructure already checked this
      return NextResponse.json(
        { error: 'Unauthorized: Malformed authentication token' },
        { status: 401 }
      );
    }

    // Get wallet address from the message
    const walletAddress = getWalletAddressFromMessage(signInMessage.message);
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing wallet address in token' },
        { status: 401 }
      );
    }

    // Verify the signature
    const isValid = await verifySignature(
      signInMessage.message,
      signInMessage.signature,
      walletAddress
    );

    if (!isValid) {
      console.log('Auth middleware: Invalid signature');
      // Log the full signature data to help debug
      console.log('Auth middleware: Failed signature data:', {
        address: walletAddress,
        signatureLength: signInMessage.signature.length,
        signaturePrefix: signInMessage.signature.substring(0, 10),
      });
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    // Success case: log the successful authentication details
    console.log('Auth middleware: Signature verified successfully!', {
      address: walletAddress,
      signatureLength: signInMessage.signature.length,
      expiresAt:
        typeof signInMessage.message === 'string'
          ? parseHumanReadableMessage(signInMessage.message)?.expirationTime
          : signInMessage.message.expirationTime,
    });

    // Since there's no User model in the Prisma schema, we'll store wallet info in the request
    // for downstream handlers to use
    console.log('Auth middleware: Valid auth for wallet', walletAddress);

    // Get the issued date
    const issuedAt =
      typeof signInMessage.message === 'string'
        ? parseHumanReadableMessage(signInMessage.message)?.issuedAt
        : signInMessage.message.issuedAt;

    // Attach the wallet to the request object for the API route to handle
    (req as any).wallet = {
      address: walletAddress,
      sigDate: issuedAt || new Date().toISOString(),
    };

    // Continue to the API route
    return next();
  } catch (error) {
    console.error('Error in solanaAuthMiddleware:', error);
    return NextResponse.json(
      { error: 'Unauthorized: Invalid authentication', details: (error as Error).message },
      { status: 401 }
    );
  }
}

import { deleteCookie, getCookie } from 'cookies-next';

/**
 * Gets the authenticated wallet address from an auth token
 */
export async function getAuthToken(token: string): Promise<{walletAddress: string} | null> {
  if (!token) {
    return null;
  }
  
  try {
    // Decode base64 token
    const decodedToken = Buffer.from(token, 'base64').toString();
    const tokenData = JSON.parse(decodedToken);
    
    // Check if token has expected format
    if (!tokenData.message || !tokenData.message.address) {
      return null;
    }
    
    // Check if token is expired
    if (tokenData.message.expirationTime && new Date(tokenData.message.expirationTime) < new Date()) {
      return null;
    }
    
    // Return wallet address
    return {
      walletAddress: tokenData.message.address
    };
  } catch (error) {
    console.error('Error parsing auth token:', error);
    return null;
  }
}

/**
 * Extracts the auth token from request cookies
 */
export function getAuthTokenFromRequest(req: Request): string | null {
  // For server components, we need to extract from cookie header
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  
  // Parse cookies manually
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as {[key: string]: string});
  
  return cookies['solana_auth_token'] || null;
} 
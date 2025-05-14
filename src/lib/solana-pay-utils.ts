/**
 * Utility functions for Solana Pay integration
 */

/**
 * Creates a Solana Pay URL for a claim token
 *
 * @param claimToken The claim token from the URL
 * @param baseUrl The base URL of the app
 * @returns Solana Pay URL for QR code generation
 */
export function createSolanaPayClaimUrl(claimToken: string, baseUrl: string): string {
  // Make sure the base URL doesn't end with a slash
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Ensure we're using https protocol
  const httpsBaseUrl = normalizedBaseUrl.replace(/^http:/, 'https:');
  
  // Create the payment endpoint (must be absolute HTTPS URL)
  // Use the public endpoint that has no authentication
  const paymentEndpoint = `${httpsBaseUrl}/api/public/solana-claim/${claimToken}`;
  
  // Format must be exactly solana:{paymentEndpoint} with NO URL encoding
  // This is critical - Solana Pay expects the URL to be directly appended after solana:
  const solanaPayUrl = `solana:${paymentEndpoint}`;
  
  console.log('Created Solana Pay URL:', solanaPayUrl);
  
  return solanaPayUrl;
}

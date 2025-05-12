import { randomBytes } from 'crypto';

/**
 * Generate a unique claim ID for tracking POP claims
 * 
 * @returns A unique claim ID string
 */
export function generateClaimId(): string {
  // Generate a random string for the claim ID
  const randomString = randomBytes(16).toString('hex');
  
  // Add a timestamp prefix to ensure uniqueness
  const timestamp = Date.now().toString(36);
  
  return `${timestamp}-${randomString}`;
}

/**
 * Validate a claim ID format
 * 
 * @param claimId The claim ID to validate
 * @returns Boolean indicating if the claim ID is valid
 */
export function isValidClaimId(claimId: string): boolean {
  // Simple validation for claim ID format
  const pattern = /^[a-z0-9]+-[a-f0-9]{32}$/;
  return pattern.test(claimId);
}

/**
 * Extract timestamp from a claim ID
 * 
 * @param claimId The claim ID to parse
 * @returns Date object representing when the claim was created
 */
export function getClaimTimestamp(claimId: string): Date | null {
  try {
    // Extract the timestamp part
    const timestampPart = claimId.split('-')[0];
    
    // Convert back from base36 to decimal
    const timestamp = parseInt(timestampPart, 36);
    
    return new Date(timestamp);
  } catch (error) {
    return null;
  }
}

/**
 * Format claim datetime for display
 * 
 * @param timestamp The timestamp to format
 * @returns Formatted string for UI display
 */
export function formatClaimDate(timestamp: Date | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Format with date and time
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
} 
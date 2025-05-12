import { formatDistance } from 'date-fns';

/**
 * Get the method title based on its type
 */
export const getMethodTitle = (methodType: string): string => {
  switch (methodType) {
    case 'ClaimLinks':
      return 'Claim Links';
    case 'SecretWord':
      return 'Secret Word';
    case 'LocationBased':
      return 'Location Based';
    case 'Airdrop':
      return 'Airdrop Distribution';
    default:
      return 'Unknown Method';
  }
};

/**
 * Format expiry information
 */
export const formatExpiry = (expiresAt: string | null): string => {
  if (!expiresAt) return 'No expiration';

  const expires = new Date(expiresAt);
  const now = new Date();

  if (expires < now) {
    return 'Expired';
  }

  return `Expires in ${formatDistance(expires, now, { addSuffix: false })}`;
};

/**
 * Generate claim URL from token
 */
export const getClaimUrl = (token: string): string => {
  return `${window.location.origin}/claim/${token}`;
};

/**
 * Calculate estimated costs for Airdrop distribution
 */
export const calculateAirdropCost = (recipientCount: number) => {
  // Constants from Helius Airdrop
  const baseFee = 5000; // 5000 lamports per transaction
  const compressionFee = 10000; // 10000 lamports for ZK compression
  const defaultComputeUnitLimit = 1400000; // Default CU limit
  const MICRO_LAMPORTS_PER_LAMPORT = 1000000; // 1 lamport = 1,000,000 microlamports
  const maxAddressesPerTransaction = 22; // Max addresses per tx for airdrop
  const defaultPriorityFee = 1; // Default priority fee in microlamports
  const accountRent = 0.00203928; // Solana rent for token accounts (~0.002 SOL)

  // Calculate number of transactions needed
  const transactionCount = Math.ceil(recipientCount / maxAddressesPerTransaction);

  // Calculate compressed fees (in SOL)
  const compressedBaseFee = (transactionCount * baseFee) / 1e9; // Convert lamports to SOL
  const compressedZkFee = (transactionCount * compressionFee) / 1e9;
  const compressedPriorityFee =
    (transactionCount * defaultComputeUnitLimit * defaultPriorityFee) /
    (MICRO_LAMPORTS_PER_LAMPORT * 1e9);
  const compressedTotal = compressedBaseFee + compressedZkFee + compressedPriorityFee;

  // Calculate normal fees (in SOL)
  const normalBaseFee = (transactionCount * baseFee) / 1e9;
  const normalAccountRent = recipientCount * accountRent;
  const normalPriorityFee =
    (transactionCount * defaultComputeUnitLimit * defaultPriorityFee) /
    (MICRO_LAMPORTS_PER_LAMPORT * 1e9);
  const normalTotal = normalBaseFee + normalAccountRent + normalPriorityFee;

  // Calculate savings
  const savingsAmount = normalTotal - compressedTotal;
  const savingsPercentage = (savingsAmount / normalTotal) * 100;
  const cappedSavingsPercentage = Math.min(savingsPercentage, 99.9);

  return {
    compressedCost: compressedTotal.toFixed(6),
    regularCost: normalTotal.toFixed(6),
    savings: cappedSavingsPercentage.toFixed(2),
    compressedDetails: {
      baseFee: compressedBaseFee.toFixed(6),
      zkFee: compressedZkFee.toFixed(6),
      priorityFee: compressedPriorityFee.toFixed(6),
    },
    regularDetails: {
      baseFee: normalBaseFee.toFixed(6),
      accountRent: normalAccountRent.toFixed(6),
      priorityFee: normalPriorityFee.toFixed(6),
    },
    txCount: transactionCount,
    recipients: recipientCount,
  };
};

// Types for the distribution methods
export interface DistributionMethod {
  id: string;
  type: 'ClaimLinks' | 'SecretWord' | 'LocationBased' | 'Airdrop';
  popId: string;
  disabled: boolean;
  createdAt: string;
  // Relations depending on the type
  claimLinks?: ClaimLink[];
  secretWord?: SecretWord;
  locationBased?: LocationBased;
  airdrop?: Airdrop;
}

export interface ClaimLink {
  id: string;
  token: string;
  claimed: boolean;
  claimedAt: string | null;
  expiresAt: string | null;
  createdAt?: string;
  claimedByWallet?: string;
  transactionSignature?: string;
}

export interface SecretWord {
  id: string;
  word: string;
  maxClaims: number | null;
  claimCount: number;
  startDate: string | null;
  endDate: string | null;
}

export interface LocationBased {
  id: string;
  city: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  radius: number;
  maxClaims: number | null;
  claimCount: number;
  startDate: string | null;
  endDate: string | null;
}

export interface Airdrop {
  id: string;
  addresses: string[];
  maxClaims: number | null;
  claimCount: number;
  startDate: string | null;
  endDate: string | null;
}

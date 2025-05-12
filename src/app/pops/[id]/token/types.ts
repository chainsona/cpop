// Interface for token data
export interface PopData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

// Token structure from the database
export interface TokenData {
  id: string;
  mintAddress: string;
  createdAt: string;
  claimed?: number;
  available?: number;
}

// Add a new interface for blockchain token data
export interface BlockchainTokenData {
  tokenSupply: number;
  authorityBalance: number;
  distributedTokens: number;
}

// Interface for token response
export interface TokenResponse {
  token: TokenData | null;
  tokenMinted: boolean;
  tokenSupply: number;
  pop: PopData;
}

// Metadata interface
export interface Metadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    edition?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
    files?: Array<{
      uri: string;
      type: string;
    }>;
  };
  external_url?: string;
  symbol?: string;
} 
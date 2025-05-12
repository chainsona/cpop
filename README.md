# cPOP - compressed Proof of Participation 🏆

A Next.js application for creating and distributing Proof of Participation (POP) tokens on Solana using compressed tokens (ZK Compression) with Token-2022 standard.

## Features

- **Create and Manage POPs**: Create tokens with title, description, image, and event details
- **Multiple Distribution Methods**:
  - Claim Links: Generate unique links that can be shared with participants
  - Secret Word: Set up a secret word that participants can use to claim tokens
  - Location-Based: Distribute tokens to participants in a specific geographic area
  - Airdrop: Send tokens directly to wallet addresses
- **Solana Integration**:
  - Automatic compressed token minting with Token-2022 standard
  - Metadata-enabled tokens for rich POP experiences
  - Wallet authentication through Solana
- **User-Friendly Interface**:
  - Modern UI built with Tailwind CSS and shadcn components
  - Form validation with Zod
  - Responsive design for all devices

## Technology Stack

- **Frontend**: Next.js, React 19, Tailwind CSS
- **Backend**:
  - Supabase for storage
  - Prisma ORM with PostgreSQL database
- **Blockchain**:
  - Solana blockchain with SPL tokens
  - ZK Compression for efficient token storage
  - Token-2022 standard for rich metadata

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended package manager)
- PostgreSQL database
- Supabase account
- Solana wallet with SOL for transactions

### Environment Setup

Create a `.env.local` file at the root of your project with the following variables:

```
# App URL
NEXT_PUBLIC_APP_URL=your_app_url_or_localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_database_url

# Solana
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
TOKEN_MINT_AUTHORITY_SECRET=your_token_mint_authority_secret_base58_encoded
NEXT_PUBLIC_SOLANA_CLUSTER=mainnet # or devnet, testnet

# Admin (optional)
ADMIN_API_TOKEN=your_admin_api_token
```

### Storage Bucket Setup

Before using the application, ensure you have a storage bucket set up in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `cpop`
4. Set the bucket's privacy settings to allow public access to files

### Installation

```bash
# Clone the repository
git clone https://github.com/chainsona/cpop.git
cd cpop

# Install dependencies
pnpm install

# Set up the database
pnpm prisma migrate dev

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development

```bash
# Run development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Check for linting issues
pnpm lint
```

## Token Minting Process

The platform manages token minting automatically:

1. **First Distribution Method**: When the first distribution method is created for a POP, the system automatically mints compressed tokens using the ZK Compression protocol and Token-2022 standard.

2. **Additional Distribution Methods**: When additional distribution methods are added to a POP, the system increases the token supply by minting more tokens.

## Deployment

The project is optimized for deployment on Vercel, but can be deployed to any platform that supports Next.js applications.

```bash
# Build for production deployment
pnpm build
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Solana Documentation](https://docs.solana.com)
- [Token-2022 Documentation](https://spl.solana.com/token-2022)

# Environment Variables Setup

To run this application, you need to set up the following environment variables in your `.env` file. Copy these variables to your environment file and replace the placeholder values with your actual configuration.

```bash
# Database Connection (Prisma with PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/pop?schema=public"

# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## Setup Instructions

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the Supabase dashboard
3. Create a storage bucket named "cpop" in your Supabase project
4. Set up a PostgreSQL database and update the `DATABASE_URL` with your connection string
5. Run `pnpm prisma migrate dev` to create the database tables

The `.env` file should be placed in the root directory of your project.

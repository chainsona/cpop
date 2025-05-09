# POAP Creation App

A Next.js application for creating Proof of Attendance Protocol (POAP) tokens with Supabase and Prisma.

## Environment Setup

Create a `.env.local` file at the root of your project with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=your_database_url
```

### Getting Supabase Service Role Key

The application now uses server-side uploads with the Supabase service role key for increased security. To get your service role key:

1. Go to your Supabase project dashboard
2. Navigate to Project Settings > API
3. Copy the "service_role key (secret)" - keep this secure and never expose it to the client
4. Add it to your `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`

## Storage Bucket Setup

Before using the application, ensure you have a storage bucket set up in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named `poap-images`
4. Set the bucket's privacy settings to allow public access to files

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Features

- Create POAPs with title, description, image, and date information
- Secure server-side image uploads to Supabase Storage
- Form validation with Zod
- Custom date picker component
- Modern UI with shadcn components

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment variables from the documentation to a `.env` file in the root directory.

3. Set up the database:

   ```bash
   pnpm prisma migrate dev
   ```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Technologies Used

- Next.js
- Prisma
- Supabase (PostgreSQL and Storage)
- React Hook Form with Zod validation
- Tailwind CSS with Shadcn UI components

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

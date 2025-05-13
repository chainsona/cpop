# Database Connection Setup

This guide explains how to set up your database connection for different environments.

## Connection Issue in Production

If you're seeing an error like:

```
Can't reach database server at db.wjsfpbeucpkahphewchk.supabase.co:5432
```

This is because direct connections to Supabase PostgreSQL on port 5432 are often blocked in deployment environments like Vercel and Kubernetes. 

## Solution

### Use PgBouncer Connection for Production

For production environments (Vercel, Kubernetes), you must use Supabase's PgBouncer connection on port 6543 with SSL enabled:

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=10&sslmode=require"
```

Key differences:
- Use port `6543` instead of `5432`
- Add query parameters:
  - `pgbouncer=true`
  - `connection_limit=10` (prevents connection pool exhaustion)
  - `sslmode=require` (required for security)

### Setup by Environment

1. **Development (Local):** 
   - Use direct connection: `postgresql://postgres:password@localhost:5432/pop`
   - Or direct Supabase connection: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

2. **Production (Vercel/Kubernetes):**
   - Use PgBouncer connection: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=10&sslmode=require`

## Using Our Helper Script

We provide a helper script to generate the correct DATABASE_URL:

```bash
# Set required environment variables
export DATABASE_HOST=db.[PROJECT-REF].supabase.co
export DATABASE_PASSWORD=[YOUR-PASSWORD]
export NODE_ENV=production  # or development, staging

# Run the script to generate the URL
node scripts/setup-db-url.js
```

## Vercel Configuration

In your Vercel project:
1. Go to Settings → Environment Variables
2. Add the required variables:
   - `DATABASE_HOST`: Your Supabase host (e.g., `db.[PROJECT-REF].supabase.co`) 
   - `DATABASE_PASSWORD`: Your database password
   - `NODE_ENV`: Set to `production`

## Kubernetes Configuration

Update your Kubernetes secrets:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: database-credentials
type: Opaque
data:
  DATABASE_PASSWORD: [base64-encoded-password]
```

And in your configmap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: database-config
data:
  DATABASE_HOST: db.[PROJECT-REF].supabase.co
  DATABASE_PORT: "6543"
  DATABASE_NAME: postgres
  DATABASE_USER: postgres
  NODE_ENV: production
```

Then in your deployment, set DATABASE_URL using our helper script. 
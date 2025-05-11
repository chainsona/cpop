# Setting Up Supabase Environment Variables

The application requires certain Supabase environment variables to function correctly. When you see the error `NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required`, follow these steps to fix it:

## Required Environment Variables

Two environment variables are **required** for the application to start:

1. `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase project
2. `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key with admin privileges

## Setting Up the Variables (Recommended Method)

### Using the Provided Script

We've created a script that automatically creates Kubernetes secrets from your environment variables. It supports multiple ways to provide the variables:

#### Method 1: Using a .env file (Recommended)

1. **Create a .env file** in the project root (or copy from .env.template if available):

```
# Required variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional variables
DATABASE_URL=postgresql://user:password@host:port/db
NEXTAUTH_SECRET=your-nextauth-secret
```

2. **Run the script** to create the secrets in Kubernetes:

```bash
# Make the script executable if needed
chmod +x scripts/create-secrets.sh

# Run the script (it will automatically load the .env file)
./scripts/create-secrets.sh
```

#### Method 2: Using environment variables in your shell

1. **Set your environment variables in your shell:**

```bash
# Required variables
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Optional variables (if needed)
export DATABASE_URL="postgresql://user:password@host:port/db"
export NEXTAUTH_SECRET="your-nextauth-secret"
```

2. **Run the script:**

```bash
./scripts/create-secrets.sh
```

#### Method 3: One-line command with inline variables

You can also pass the variables directly to the script:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
./scripts/create-secrets.sh
```

### Method 4: Using kustomize (For local development only)

We've also configured kustomize to generate the secrets, but you'll need to edit the literals in the `kustomization.yaml` file:

```bash
# Apply using kustomize
kubectl apply -k kubernetes/
```

**Note:** For production environments, use one of the script methods above instead of hardcoding values in kustomization.yaml.

## Getting Your Supabase Credentials

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Project Settings → API
4. The Project URL is your `NEXT_PUBLIC_SUPABASE_URL`
5. Under "Project API keys", copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Under "Project API keys", copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY`

## CI/CD Integration

If you're using CI/CD, add these environment variables to your pipeline secrets. For example, with GitHub Actions:

```yaml
# GitHub Actions workflow example
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ... your other steps ...
      - name: Create Kubernetes secrets
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
        run: ./scripts/create-secrets.sh
```

## Verifying the Configuration

After updating the environment variables, check the logs to verify the application starts correctly:

```bash
kubectl logs -l app=cpop-ui -n cpop --follow
```

If successful, you should see "Starting Next.js application with runtime environment" without any environment variable errors. 
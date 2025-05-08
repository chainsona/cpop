#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_TEMPLATE = `# Database Connection (Prisma with PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/poap?schema=public"

# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Note: Make sure to create a storage bucket named "poap-images" in your Supabase project
# for the image upload functionality to work properly
`;

const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

console.log('🚀 POAP Application - Environment Setup');
console.log('---------------------------------------');
console.log('This script will help you set up your .env file.');

if (fs.existsSync(ENV_FILE_PATH)) {
  rl.question('\n⚠️ An .env file already exists. Overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createEnvFile();
    } else {
      console.log('\n❌ Setup cancelled. Your existing .env file was not modified.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Creating .env file with template values...');
  
  fs.writeFileSync(ENV_FILE_PATH, ENV_TEMPLATE);
  
  console.log('\n✅ .env file created successfully!');
  console.log('\n⚠️ Make sure to update the placeholder values with your actual configuration:');
  console.log('  1. Set up a PostgreSQL database and update DATABASE_URL');
  console.log('  2. Create a Supabase project and update SUPABASE_URL and SUPABASE_ANON_KEY');
  console.log('  3. Create a "poap-images" storage bucket in your Supabase project');
  console.log('\n📖 For more information, see docs/ENV_SETUP.md');
  
  rl.close();
} 
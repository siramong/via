#!/bin/bash
# Setup guide for VIA project

echo "🚀 VIA - Cheapest Fuel in Real Time Setup"
echo "=========================================="
echo ""

# 1. Environment setup
echo "1️⃣ Setting up environment variables..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env file. Please fill in your Supabase credentials."
else
  echo "✅ .env already exists"
fi

# 2. Dependencies
echo ""
echo "2️⃣ Installing dependencies..."
npm install

# 3. Instructions
echo ""
echo "3️⃣ Next steps:"
echo "   ✓ Fill in .env with your Supabase credentials"
echo "   ✓ Create a Supabase project at https://supabase.com"
echo "   ✓ Run the SQL schema from docs/SUPABASE_RPC_SETUP.sql"
echo "   ✓ Enable PostGIS extension in your Supabase database"
echo "   ✓ Configure Google OAuth in Supabase Auth settings"
echo "   ✓ Set redirect URL to: via://auth"
echo ""
echo "4️⃣ Start development:"
echo "   npm start"
echo ""
echo "✨ Done! Happy coding."

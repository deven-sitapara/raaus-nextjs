#!/bin/bash
###############################################################################
# Deploy .env.staging to Vercel
# 
# This script reads .env.staging and uploads all variables to Vercel
# 
# Usage:
#   chmod +x deploy-env-to-vercel.sh
#   ./deploy-env-to-vercel.sh
###############################################################################

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🚀 Deploy Environment Variables to Vercel                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    echo "❌ Error: .env.staging file not found!"
    echo ""
    echo "💡 Create .env.staging first with your staging environment variables."
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not installed."
    echo ""
    echo "Installing Vercel CLI globally..."
    npm install -g vercel
    echo ""
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
vercel whoami || vercel login

echo ""
echo "📋 Reading .env.staging..."
echo ""

# Read .env.staging and add each variable to Vercel
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^#.*$ ]] && continue
    
    # Remove quotes from value if present
    value="${value%\"}"
    value="${value#\"}"
    
    # Skip if value is empty or placeholder
    if [[ -z "$value" || "$value" == "your_"* || "$value" == "xxxxx"* ]]; then
        echo "⏭️  Skipping $key (empty or placeholder)"
        continue
    fi
    
    echo "📤 Adding: $key"
    
    # Add to Vercel for production environment
    # Use --yes flag to skip confirmation
    vercel env add "$key" production <<EOF
$value
EOF
    
done < .env.staging

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Environment Variables Deployed to Vercel!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📝 Next Steps:"
echo "   1. Verify in Vercel Dashboard:"
echo "      https://vercel.com/[your-project]/settings/environment-variables"
echo ""
echo "   2. Redeploy your application:"
echo "      vercel --prod"
echo ""
echo "   3. Or trigger redeploy from Vercel Dashboard"
echo ""


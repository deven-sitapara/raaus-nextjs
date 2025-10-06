#!/bin/bash

# Script to add environment variables to Vercel
# Run this script: chmod +x deploy-env.sh && ./deploy-env.sh

echo "Adding environment variables to Vercel production..."

# Zoho CRM Configuration
echo "1000.O29OB4G48MGWHWAPXLB2CDXGX7B81U" | vercel env add ZOHO_CRM_CLIENT_ID production
echo "27a6602b97b4a08b029c9695332c5e70eb38231766" | vercel env add ZOHO_CRM_CLIENT_SECRET production
echo "1000.e05ad0877ad24f274091f6c64141e9d6.7931ad026aed6dc7f8c8eaad40ce909d" | vercel env add ZOHO_CRM_REFRESH_TOKEN production
echo "https://www.zohoapis.com.au" | vercel env add ZOHO_CRM_API_DOMAIN production
echo "Occurrence_Management" | vercel env add ZOHO_CRM_MODULE production

# Zoho WorkDrive Configuration
echo "1000.O29OB4G48MGWHWAPXLB2CDXGX7B81U" | vercel env add ZOHO_WORKDRIVE_CLIENT_ID production
echo "27a6602b97b4a08b029c9695332c5e70eb38231766" | vercel env add ZOHO_WORKDRIVE_CLIENT_SECRET production
echo "1000.e05ad0877ad24f274091f6c64141e9d6.7931ad026aed6dc7f8c8eaad40ce909d" | vercel env add ZOHO_WORKDRIVE_REFRESH_TOKEN production
echo "wi3c6bb69a60ccee14c828111a1c46e1f3faa" | vercel env add ZOHO_WORKDRIVE_FOLDER_ID production

# Application Settings
echo "https://raaus-nextjs-1qf5jq48l-sdevens-projects.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

echo "Done! All environment variables have been added to Vercel production."
echo "Don't forget to redeploy your app: vercel --prod"

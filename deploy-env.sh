#!/bin/bash

# Script to add environment variables to Vercel
# Run this script: chmod +x deploy-env.sh && ./deploy-env.sh

echo "Adding environment variables to Vercel production..."

# Zoho Configuration (AU Region)
# Primary Token - Single OAuth app with combined scopes for both CRM and WorkDrive
echo "1000.GA3GN2FRRBVLXI2QYZJH9V8LAWC9RM" | vercel env add ZOHO_CLIENT_ID production
echo "696198d8b9348cb1060bd5a13cbeb64a5bd38ba9b3" | vercel env add ZOHO_CLIENT_SECRET production
echo "1000.1841b134bf535d138fa95eb9c2cb5cf9.1b5097965a98b5c2fe2c3a5efe9d798a" | vercel env add ZOHO_REFRESH_TOKEN production

# Zoho CRM Configuration
echo "https://www.zohoapis.com.au" | vercel env add ZOHO_CRM_API_DOMAIN production
echo "Occurrence_Management" | vercel env add ZOHO_CRM_MODULE production

# WorkDrive Folder Configuration
# Parent folder ID for the "Occurrence_Management" team folder
echo "wi3c674a900ff8c884b088a22f539049c1ab2" | vercel env add ZOHO_WORKDRIVE_PARENT_FOLDER_ID production

# Legacy WorkDrive folder (for backward compatibility)
echo "wi3c6bb69a60ccee14c828111a1c46e1f3faa" | vercel env add ZOHO_WORKDRIVE_FOLDER_ID production

# Application Settings
echo "https://raaus-nextjs.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production

echo "Done! All environment variables have been added to Vercel production."
echo "Don't forget to redeploy your app: vercel --prod"

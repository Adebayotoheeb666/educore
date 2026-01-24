#!/bin/bash

# Staff Auth Audit - Edge Function Deployment Script
# This script deploys the required Edge Functions for Staff Auth Audit functionality

set -e

echo "🚀 Deploying Staff Auth Audit Edge Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo ""
    echo "Or use npx:"
    echo "  npx supabase functions deploy audit-staff-auth"
    echo "  npx supabase functions deploy create-staff-auth"
    exit 1
fi

# Check if logged in
echo "📋 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "Please run: supabase login"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Deploy audit function
echo "📦 Deploying audit-staff-auth function..."
supabase functions deploy audit-staff-auth

echo ""

# Deploy create function
echo "📦 Deploying create-staff-auth function..."
supabase functions deploy create-staff-auth

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Testing functions..."
echo ""

# Get project ref
PROJECT_REF=$(supabase projects list --output json | jq -r '.[0].id' 2>/dev/null || echo "")

if [ -n "$PROJECT_REF" ]; then
    echo "Project: $PROJECT_REF"
    echo ""
    echo "Function URLs:"
    echo "  - https://$PROJECT_REF.supabase.co/functions/v1/audit-staff-auth"
    echo "  - https://$PROJECT_REF.supabase.co/functions/v1/create-staff-auth"
else
    echo "⚠️  Could not determine project ref"
    echo "Check your functions at: Supabase Dashboard > Edge Functions"
fi

echo ""
echo "✅ All done! You can now use the Staff Auth Audit page."

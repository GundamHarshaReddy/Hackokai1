#!/bin/bash

# Script to create job_interests table
# Make sure you have Supabase CLI installed and configured

echo "Creating job_interests table..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Create the table using the SQL file
echo "Executing SQL to create job_interests table..."
supabase db reset --local

echo "Table creation completed!"
echo ""
echo "If you're using a remote Supabase instance:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of 'create-job-interests-table.sql'"
echo "4. Click 'Run'"

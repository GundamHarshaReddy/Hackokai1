# Job Interests Setup Guide

## The Error

The error you're seeing indicates that the `job_interests` table doesn't exist in your Supabase database yet.

## Quick Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy the entire content from `create-job-interests-table.sql`
4. Paste it in the SQL editor
5. Click "Run" button
6. You should see "job_interests table created successfully"

### Option 2: Using Supabase CLI (if you have it installed)

```bash
# Run this in your terminal
chmod +x create-table.sh
./create-table.sh
```

### Option 3: Manual SQL (Copy this to Supabase SQL Editor)

```sql
CREATE TABLE IF NOT EXISTS job_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL,
    job_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, job_id)
);

ALTER TABLE job_interests 
ADD CONSTRAINT job_interests_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE job_interests 
ADD CONSTRAINT job_interests_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

CREATE INDEX idx_job_interests_student_id ON job_interests(student_id);
CREATE INDEX idx_job_interests_job_id ON job_interests(job_id);
```

## After Creating the Table

1. Refresh your application at `http://localhost:3000/student/opportunities`
2. Complete your assessment or enter your phone number
3. The "Interest" buttons should now work without errors
4. Interested jobs will be saved to the database

## Testing

1. Click the "Interest" button on any job
2. It should change to "Interested" with red background
3. Refresh the page - the button should remain in "Interested" state
4. Check the "Your Interested Jobs" section appears when you have saved jobs

## Troubleshooting

If you still get errors:
1. Check the browser console for specific error messages
2. Verify the table was created in Supabase dashboard -> Database -> Tables
3. Make sure your Supabase connection is working
4. Try refreshing the page and testing again

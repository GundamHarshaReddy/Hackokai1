-- Create job_interests table
-- Run this SQL command in your Supabase SQL editor

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS job_interests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL,
    job_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, job_id)
);

-- Add foreign key constraints (these will be ignored if they already exist)
DO $$ 
BEGIN
    -- Add foreign key for student_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_interests_student_id_fkey'
    ) THEN
        ALTER TABLE job_interests 
        ADD CONSTRAINT job_interests_student_id_fkey 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key for job_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'job_interests_job_id_fkey'
    ) THEN
        ALTER TABLE job_interests 
        ADD CONSTRAINT job_interests_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_interests_student_id ON job_interests(student_id);
CREATE INDEX IF NOT EXISTS idx_job_interests_job_id ON job_interests(job_id);

-- Verify the table was created
SELECT 'job_interests table created successfully' as message;

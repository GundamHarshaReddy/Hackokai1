-- =====================================================
-- RLS POLICY UPDATES FOR ANONYMOUS ACCESS
-- =====================================================
-- This file updates the RLS policies to allow anonymous access
-- Run this in your Supabase SQL Editor if you already have the database set up
-- =====================================================

-- Drop existing job policies
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Job creators can update their jobs" ON public.jobs;
DROP POLICY IF EXISTS "Job creators can delete their jobs" ON public.jobs;

-- Create new job policies allowing anonymous access
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can post jobs" ON public.jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Job creators can update their jobs" ON public.jobs
  FOR UPDATE USING (true);

CREATE POLICY "Job creators can delete their jobs" ON public.jobs
  FOR DELETE USING (true);

-- Drop existing student policies  
DROP POLICY IF EXISTS "Students can insert their own profile" ON public.students;
DROP POLICY IF EXISTS "Students are viewable by everyone" ON public.students;
DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;

-- Create new student policies allowing anonymous access
CREATE POLICY "Students are viewable by everyone" ON public.students
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can insert students" ON public.students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Drop existing student job interest policies
DROP POLICY IF EXISTS "Students can manage their own interests" ON public.student_job_interests;
DROP POLICY IF EXISTS "Users can view job interests" ON public.student_job_interests;

-- Create new student job interest policies allowing anonymous access
CREATE POLICY "Users can view job interests" ON public.student_job_interests
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can express interest" ON public.student_job_interests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Students can update their own interests" ON public.student_job_interests
  FOR UPDATE USING (auth.uid()::text = student_id::text);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'RLS POLICIES UPDATED SUCCESSFULLY!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'All tables now allow anonymous access for:';
  RAISE NOTICE '- Job posting';
  RAISE NOTICE '- Student registration';
  RAISE NOTICE '- Job interest expression';
  RAISE NOTICE 'Your database is ready for anonymous access!';
  RAISE NOTICE '=====================================';
END $$;

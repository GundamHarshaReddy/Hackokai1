-- =====================================================
-- HACKOKAI COMPLETE DATABASE SETUP
-- =====================================================
-- This file contains the complete database schema, constraints,
-- indexes, functions, sample data, and RLS policies for the Hackokai project
--
-- Instructions:
-- 1. Copy this entire file
-- 2. Go to your Supabase dashboard > SQL Editor
-- 3. Paste and run this code
-- 4. Your database will be fully set up with sample data
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE CREATION
-- =====================================================

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  education_degree VARCHAR(255) NOT NULL,
  specialization VARCHAR(255) NOT NULL,
  core_values TEXT[] NOT NULL,
  work_preferences JSONB NOT NULL,
  personality_scores JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR(20) UNIQUE NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  job_description TEXT NOT NULL,
  location VARCHAR(255),
  salary_stipend VARCHAR(255),
  key_skills TEXT[],
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create student_job_interests table
CREATE TABLE IF NOT EXISTS public.student_job_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  fitment_score INTEGER CHECK (fitment_score >= 0 AND fitment_score <= 100),
  is_interested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(student_id, job_id)
);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);
CREATE INDEX IF NOT EXISTS idx_students_education_degree ON public.students(education_degree);
CREATE INDEX IF NOT EXISTS idx_students_specialization ON public.students(specialization);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON public.jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON public.jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);

-- Student job interests table indexes
CREATE INDEX IF NOT EXISTS idx_student_job_interests_student_id ON public.student_job_interests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_job_interests_job_id ON public.student_job_interests(job_id);
CREATE INDEX IF NOT EXISTS idx_student_job_interests_is_interested ON public.student_job_interests(is_interested);
CREATE INDEX IF NOT EXISTS idx_student_job_interests_fitment_score ON public.student_job_interests(fitment_score);
CREATE INDEX IF NOT EXISTS idx_student_job_interests_created_at ON public.student_job_interests(created_at);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- =====================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Students table constraints
ALTER TABLE public.students
ADD CONSTRAINT check_phone_format
CHECK (phone ~ '^[+]?[0-9\s\-()]{8,20}$');

ALTER TABLE public.students
ADD CONSTRAINT check_email_format
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Jobs table constraints
ALTER TABLE public.jobs
ADD CONSTRAINT check_job_type
CHECK (job_type IN ('Internship', 'Full-Time', 'Part-Time', 'Freelance', 'Contract'));

ALTER TABLE public.jobs
ADD CONSTRAINT check_contact_number_format
CHECK (contact_number ~ '^[+]?[0-9\s\-()]{8,20}$');

-- Users table constraints
ALTER TABLE public.users
ADD CONSTRAINT check_user_role
CHECK (role IN ('user', 'admin', 'student', 'company', 'recruiter'));

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get job interest count
CREATE OR REPLACE FUNCTION public.get_job_interest_count(job_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.student_job_interests WHERE job_id = job_uuid AND is_interested = true);
END;
$$ LANGUAGE plpgsql;

-- Function to get student application count
CREATE OR REPLACE FUNCTION public.get_student_application_count(student_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.student_job_interests WHERE student_id = student_uuid AND is_interested = true);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate job compatibility score
CREATE OR REPLACE FUNCTION public.calculate_compatibility_score(
  student_preferences JSONB,
  job_requirements JSONB
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  max_score INTEGER := 0;
  key TEXT;
  student_val NUMERIC;
  job_val NUMERIC;
BEGIN
  FOR key IN SELECT jsonb_object_keys(student_preferences)
  LOOP
    IF job_requirements ? key THEN
      student_val := (student_preferences->>key)::NUMERIC;
      job_val := (job_requirements->>key)::NUMERIC;
      score := score + (100 - ABS(student_val - job_val));
      max_score := max_score + 100;
    END IF;
  END LOOP;
  
  IF max_score = 0 THEN
    RETURN 50; -- Default score if no matching criteria
  END IF;
  
  RETURN (score * 100 / max_score)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at on students
DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on jobs
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on student_job_interests
DROP TRIGGER IF EXISTS update_student_job_interests_updated_at ON public.student_job_interests;
CREATE TRIGGER update_student_job_interests_updated_at
  BEFORE UPDATE ON public.student_job_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on users
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_job_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Students policies - Allow anonymous access for student registration
CREATE POLICY "Students are viewable by everyone" ON public.students
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can insert students" ON public.students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Jobs policies - Allow anonymous job posting
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can post jobs" ON public.jobs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Job creators can update their jobs" ON public.jobs
  FOR UPDATE USING (true);

CREATE POLICY "Job creators can delete their jobs" ON public.jobs
  FOR DELETE USING (true);

-- Student job interests policies - Allow anonymous access for expressing interest
CREATE POLICY "Users can view job interests" ON public.student_job_interests
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can express interest" ON public.student_job_interests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Students can update their own interests" ON public.student_job_interests
  FOR UPDATE USING (auth.uid()::text = student_id::text);

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample jobs
INSERT INTO public.jobs (job_id, contact_name, contact_number, company_name, job_title, job_type, job_description, location, salary_stipend, key_skills, qr_code_url) VALUES
('JOB_0001', 'Rahul Sharma', '+91 9876543210', 'TechCorp Solutions', 'Software Engineer Intern', 'Internship', 'We are looking for a passionate software engineering intern to join our development team. You will work on real-world projects using modern technologies and gain hands-on experience in full-stack development. This role offers mentorship from senior developers and exposure to agile development practices.', 'Bangalore, India', '₹25,000/month', ARRAY['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0001'),
('JOB_0002', 'Priya Patel', '+91 9876543211', 'DataFlow Analytics', 'Data Analyst', 'Full-Time', 'Join our data analytics team to help businesses make data-driven decisions. You will work with large datasets, create visualizations, and provide insights that drive business growth. Experience with statistical analysis and business intelligence tools is preferred.', 'Mumbai, India', '₹45,000/month', ARRAY['Python', 'SQL', 'Tableau', 'Excel', 'Statistics', 'Power BI'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0002'),
('JOB_0003', 'Amit Kumar', '+91 9876543212', 'DesignHub Studio', 'UI/UX Designer', 'Freelance', 'We need a creative UI/UX designer for multiple client projects. You will be responsible for creating user-centered designs, wireframes, and prototypes for web and mobile applications. Strong portfolio and understanding of design principles required.', 'Remote', '₹35,000/project', ARRAY['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research', 'Wireframing'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0003'),
('JOB_0004', 'Sneha Reddy', '+91 9876543213', 'CloudTech Innovations', 'DevOps Engineer', 'Full-Time', 'Looking for a DevOps engineer to manage our cloud infrastructure and deployment pipelines. You will work with AWS, Docker, Kubernetes, and help scale our applications. Experience with CI/CD pipelines and monitoring tools is essential.', 'Hyderabad, India', '₹60,000/month', ARRAY['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Linux', 'Terraform'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0004'),
('JOB_0005', 'Vikram Singh', '+91 9876543214', 'MarketPro Digital', 'Digital Marketing Intern', 'Internship', 'Join our marketing team to learn digital marketing strategies, social media management, and content creation. Perfect opportunity for students to gain real-world marketing experience and work on campaigns for various clients.', 'Delhi, India', '₹20,000/month', ARRAY['Social Media', 'Content Writing', 'SEO', 'Google Analytics', 'Canva', 'Facebook Ads'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0005'),
('JOB_0006', 'Meera Joshi', '+91 9876543215', 'FinTech Solutions', 'Full Stack Developer', 'Full-Time', 'We are seeking a full stack developer to build and maintain our financial technology applications. You will work on both frontend and backend development, ensuring high performance and security standards for financial transactions.', 'Pune, India', '₹55,000/month', ARRAY['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'REST APIs', 'Security'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0006'),
('JOB_0007', 'Arjun Nair', '+91 9876543216', 'EduTech Innovations', 'Product Manager', 'Full-Time', 'Join our product team to drive the development of educational technology solutions. You will work closely with engineering, design, and business teams to define product strategy and roadmap. Experience in edtech or SaaS products preferred.', 'Bangalore, India', '₹70,000/month', ARRAY['Product Strategy', 'Agile', 'User Research', 'Analytics', 'Roadmapping', 'Stakeholder Management'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0007'),
('JOB_0008', 'Kavitha Menon', '+91 9876543217', 'GreenEnergy Corp', 'Data Science Intern', 'Internship', 'Opportunity to work on renewable energy data projects. You will analyze energy consumption patterns, build predictive models, and contribute to sustainability initiatives. Great learning experience in the green energy sector.', 'Chennai, India', '₹22,000/month', ARRAY['Python', 'Machine Learning', 'Pandas', 'Jupyter', 'Data Visualization', 'Statistics'], 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=http://localhost:3000/job/JOB_0008');

-- Insert sample students
INSERT INTO public.students (name, email, phone, education_degree, specialization, core_values, work_preferences, personality_scores) VALUES
('Arjun Mehta', 'arjun.mehta@email.com', '+91 9876543220', 'B.Tech', 'Computer Science', ARRAY['Innovation', 'Excellence', 'Growth', 'Collaboration', 'Impact'], '{"independence": 70, "structure": 60, "pace": 80, "innovation": 90, "interaction": 65}', '{"openness": 4, "conscientiousness": 5, "extraversion": 4, "agreeableness": 5, "neuroticism": 3, "analytical": 4, "creative": 3}'),
('Kavya Sharma', 'kavya.sharma@email.com', '+91 9876543221', 'BCA', 'Information Technology', ARRAY['Creativity', 'Balance', 'Learning', 'Integrity', 'Recognition'], '{"independence": 50, "structure": 70, "pace": 60, "innovation": 75, "interaction": 80}', '{"openness": 3, "conscientiousness": 4, "extraversion": 3, "agreeableness": 4, "neuroticism": 4, "analytical": 5, "creative": 2}'),
('Rohit Gupta', 'rohit.gupta@email.com', '+91 9876543222', 'M.Tech', 'Data Science', ARRAY['Excellence', 'Innovation', 'Growth', 'Autonomy', 'Impact'], '{"independence": 85, "structure": 40, "pace": 75, "innovation": 95, "interaction": 45}', '{"openness": 5, "conscientiousness": 3, "extraversion": 4, "agreeableness": 5, "neuroticism": 2, "analytical": 3, "creative": 4}'),
('Ananya Iyer', 'ananya.iyer@email.com', '+91 9876543223', 'B.Des', 'User Experience Design', ARRAY['Creativity', 'Innovation', 'Balance', 'Collaboration', 'Excellence'], '{"independence": 60, "structure": 50, "pace": 70, "innovation": 85, "interaction": 75}', '{"openness": 3, "conscientiousness": 4, "extraversion": 3, "agreeableness": 5, "neuroticism": 4, "analytical": 4, "creative": 3}'),
('Karthik Nair', 'karthik.nair@email.com', '+91 9876543224', 'MBA', 'Marketing', ARRAY['Leadership', 'Growth', 'Impact', 'Recognition', 'Collaboration'], '{"independence": 75, "structure": 65, "pace": 85, "innovation": 70, "interaction": 90}', '{"openness": 4, "conscientiousness": 5, "extraversion": 5, "agreeableness": 4, "neuroticism": 3, "analytical": 5, "creative": 4}'),
('Sneha Patel', 'sneha.patel@email.com', '+91 9876543225', 'B.Tech', 'Electronics Engineering', ARRAY['Innovation', 'Quality', 'Learning', 'Teamwork', 'Excellence'], '{"independence": 65, "structure": 75, "pace": 70, "innovation": 80, "interaction": 70}', '{"openness": 4, "conscientiousness": 5, "extraversion": 3, "agreeableness": 4, "neuroticism": 3, "analytical": 5, "creative": 3}'),
('Rahul Verma', 'rahul.verma@email.com', '+91 9876543226', 'MCA', 'Software Development', ARRAY['Growth', 'Innovation', 'Excellence', 'Autonomy', 'Impact'], '{"independence": 80, "structure": 55, "pace": 85, "innovation": 90, "interaction": 60}', '{"openness": 5, "conscientiousness": 4, "extraversion": 4, "agreeableness": 3, "neuroticism": 2, "analytical": 5, "creative": 4}'),
('Pooja Singh', 'pooja.singh@email.com', '+91 9876543227', 'B.Com', 'Finance', ARRAY['Stability', 'Growth', 'Integrity', 'Excellence', 'Balance'], '{"independence": 55, "structure": 80, "pace": 65, "innovation": 60, "interaction": 75}', '{"openness": 3, "conscientiousness": 5, "extraversion": 4, "agreeableness": 4, "neuroticism": 3, "analytical": 4, "creative": 2}');

-- Insert sample student job interests with realistic fitment scores
INSERT INTO public.student_job_interests (student_id, job_id, fitment_score, is_interested)
SELECT
  s.id,
  j.id,
  CASE
    WHEN s.specialization = 'Computer Science' AND j.job_title LIKE '%Software%' THEN FLOOR(RANDOM() * 20 + 80)::INTEGER
    WHEN s.specialization = 'Data Science' AND j.job_title LIKE '%Data%' THEN FLOOR(RANDOM() * 15 + 85)::INTEGER
    WHEN s.specialization = 'User Experience Design' AND j.job_title LIKE '%UI/UX%' THEN FLOOR(RANDOM() * 15 + 85)::INTEGER
    WHEN s.specialization = 'Marketing' AND j.job_title LIKE '%Marketing%' THEN FLOOR(RANDOM() * 20 + 80)::INTEGER
    ELSE FLOOR(RANDOM() * 40 + 50)::INTEGER
  END,
  CASE
    WHEN RANDOM() > 0.7 THEN true
    ELSE false
  END
FROM public.students s
CROSS JOIN public.jobs j
WHERE RANDOM() > 0.3; -- Create interests for 70% of combinations

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View for job statistics
CREATE OR REPLACE VIEW public.job_stats AS
SELECT
  j.job_type,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN sji.is_interested = true THEN 1 END) as interested_applications,
  AVG(sji.fitment_score) as avg_fitment_score,
  j.location
FROM public.jobs j
LEFT JOIN public.student_job_interests sji ON j.id = sji.job_id
GROUP BY j.job_type, j.location;

-- View for student engagement
CREATE OR REPLACE VIEW public.student_engagement AS
SELECT
  s.specialization,
  s.education_degree,
  COUNT(sji.id) as total_interests,
  COUNT(CASE WHEN sji.is_interested = true THEN 1 END) as positive_interests,
  AVG(sji.fitment_score) as avg_fitment_score
FROM public.students s
LEFT JOIN public.student_job_interests sji ON s.id = sji.student_id
GROUP BY s.specialization, s.education_degree;

-- View for company insights
CREATE OR REPLACE VIEW public.company_insights AS
SELECT
  j.company_name,
  COUNT(j.id) as total_jobs_posted,
  COUNT(DISTINCT sji.student_id) as unique_interested_students,
  AVG(sji.fitment_score) as avg_student_match_score,
  j.location
FROM public.jobs j
LEFT JOIN public.student_job_interests sji ON j.id = sji.job_id
WHERE sji.is_interested = true
GROUP BY j.company_name, j.location;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'HACKOKAI DATABASE SETUP COMPLETED!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Tables created: students, jobs, student_job_interests, users';
  RAISE NOTICE 'Sample data inserted: % students, % jobs',
    (SELECT COUNT(*) FROM public.students),
    (SELECT COUNT(*) FROM public.jobs);
  RAISE NOTICE 'Indexes, constraints, and RLS policies applied';
  RAISE NOTICE 'Analytics views created: job_stats, student_engagement, company_insights';
  RAISE NOTICE 'Your database is ready for the Hackokai application!';
  RAISE NOTICE '=====================================';
END $$;

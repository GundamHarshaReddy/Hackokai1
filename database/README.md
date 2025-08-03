# Database Setup Instructions

## Fresh Database Setup

This guide will help you set up a completely fresh database for the Hackokai project.

### Prerequisites

1. Access to your Supabase dashboard
2. The `complete-setup.sql` file in the `database/` folder

### Setup Steps

1. **Go to Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to the **SQL Editor** section

2. **Clear Existing Tables (if any)**
   - If you have existing tables that need to be removed, run this first:
   ```sql
   -- Drop existing tables in correct order (to handle foreign key constraints)
   DROP TABLE IF EXISTS public.student_job_interests CASCADE;
   DROP TABLE IF EXISTS public.students CASCADE;
   DROP TABLE IF EXISTS public.jobs CASCADE;
   DROP TABLE IF EXISTS public.users CASCADE;
   
   -- Drop any existing functions
   DROP FUNCTION IF EXISTS public.get_job_interest_count(UUID) CASCADE;
   DROP FUNCTION IF EXISTS public.get_student_application_count(UUID) CASCADE;
   DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
   DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
   DROP FUNCTION IF EXISTS public.calculate_compatibility_score(JSONB, JSONB) CASCADE;
   
   -- Drop views
   DROP VIEW IF EXISTS public.job_stats CASCADE;
   DROP VIEW IF EXISTS public.student_engagement CASCADE;
   DROP VIEW IF EXISTS public.company_insights CASCADE;
   ```

3. **Run the Complete Setup**
   - Copy the entire contents of `database/complete-setup.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

4. **Verify Setup**
   - You should see success messages in the output
   - Check that tables are created by going to **Table Editor**
   - Verify sample data exists by viewing the tables

### What Gets Created

#### Tables
- `students` - Student profiles with assessment data
- `jobs` - Job postings from companies
- `student_job_interests` - Track student interest in jobs
- `users` - User authentication data

#### Features
- **Indexes** for fast querying
- **Constraints** for data integrity
- **Triggers** for automatic timestamp updates
- **Functions** for calculating scores and counts
- **RLS Policies** allowing anonymous student registration
- **Sample Data** with 8 jobs and 8 students
- **Analytics Views** for insights

#### Key Improvements
- Anonymous access for student registration (no auth required)
- Anonymous access for expressing job interest
- Proper foreign key relationships
- Comprehensive sample data for testing
- Analytics views for business insights

### Environment Variables

Make sure your `.env.local` file has these required variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Groq AI Configuration  
GROQ_API_KEY=your_groq_api_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Testing

After setup, you can test the database by:

1. Starting the Next.js application: `npm run dev`
2. Visiting `http://localhost:3000`
3. Taking the student assessment
4. Viewing job opportunities
5. Expressing interest in jobs

The application should work without authentication issues thanks to the updated RLS policies.

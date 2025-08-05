# Supabase Setup Guide for Hackokai

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Choose your organization
4. Fill in your project details:
   - Name: `hackokai` or any name you prefer
   - Database Password: Create a strong password (save this!)
   - Region: Choose the region closest to your users
5. Click "Create new project"

## 2. Set up the Database Schema

1. In your Supabase dashboard, go to the "SQL Editor" tab
2. Copy the contents of `supabase-schema.sql` from your project
3. Paste it into the SQL editor and click "Run"
4. This will create all the necessary tables and insert sample job data

## 3. Get Your Environment Variables

1. In your Supabase dashboard, go to "Settings" > "API"
2. Copy the following values:
   - Project URL
   - `anon` `public` key

## 4. Configure Your Environment

1. Create a `.env.local` file in your project root (copy from `.env.example`)
2. Add your Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI API Key (for career recommendations)
OPENAI_API_KEY=your_openai_api_key_here
```

## 5. Database Tables Created

### Students Table
- Stores all student assessment data
- Includes basic info, core values, work preferences, and personality scores
- Unique constraints on email and phone

### Career Recommendations Table
- Stores AI-generated career recommendations for each student
- Links to students table
- Includes role, match score, explanation, and job openings

### Jobs Table
- Stores job postings from companies
- Includes company info, job details, and required skills

### Job Applications Table
- Tracks student applications to jobs
- Links students to jobs they're interested in
- Includes application status tracking

## 6. Features Now Available

### For Students:
- ✅ Complete career assessment with data persistence
- ✅ Accurate fitment scores based on comprehensive analysis
- ✅ Email and phone validation during registration
- ✅ Career recommendations saved to profile
- ✅ Job application tracking

### For Companies:
- ✅ Post jobs with full details
- ✅ Job data stored in database
- ✅ QR code generation for job listings

### For Admins:
- ✅ View all students and their assessments
- ✅ Search students by phone/email
- ✅ Track job applications and student engagement

## 7. Enhanced Fitment Scoring

The system now calculates accurate fitment scores based on:

1. **Education Match (25%)**: How well the student's degree and specialization align with the role
2. **Core Values Alignment (25%)**: Match between student's selected values and role requirements
3. **Work Style Preferences (25%)**: Compatibility of work preferences with role characteristics
4. **Personality Traits (25%)**: How personality scores align with role demands

Scores range from 40-98% to provide realistic and meaningful career guidance.

## 8. Testing the Setup

1. Start your development server: `npm run dev`
2. Go to `/student/assessment` to test the complete flow
3. Fill out the assessment and verify data is saved in Supabase
4. Check the "students" and "career_recommendations" tables in your Supabase dashboard

## 9. Row Level Security (RLS)

The database is configured with RLS policies that allow anonymous access for the assessment flow while maintaining security. You can modify these policies in the Supabase dashboard under "Authentication" > "Policies" if needed.

## 10. Next Steps

- Set up proper authentication if needed
- Configure email notifications for job applications
- Add admin dashboard functionality
- Implement advanced search and filtering
- Add analytics and reporting features

## Troubleshooting

### Common Issues:

1. **Environment Variables**: Make sure your `.env.local` file is in the root directory and not committed to git
2. **CORS Issues**: Supabase should handle CORS automatically, but ensure your project URL is correct
3. **RLS Policies**: If you get permission errors, check the RLS policies in your Supabase dashboard
4. **API Keys**: Ensure you're using the `anon` public key, not the service role key for client-side operations

### Getting Help:

- Check Supabase documentation: https://supabase.com/docs
- Review the database logs in your Supabase dashboard
- Check the browser console for error messages
- Verify your API calls in the Network tab of developer tools

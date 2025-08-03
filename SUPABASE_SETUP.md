# Supabase Integration Setup

This project is integrated with Supabase for backend services including authentication, database, and storage.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new account or sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "hackokai")
5. Enter a strong database password
6. Choose a region close to your users
7. Click "Create new project"

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your project URL and anon key
3. Update your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the content from `database/schema.sql`
3. Run the SQL commands to create your database structure

### 4. Configure Authentication (Optional)

If you want to use Supabase Auth:

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL: `http://localhost:3000` (for development)
3. Configure redirect URLs if needed
4. Enable/disable auth providers as needed

### 5. Set Up Storage (Optional)

If you need file storage:

1. In your Supabase dashboard, go to Storage
2. Create buckets as needed
3. Configure bucket policies

## Usage

### Authentication

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <button onClick={() => signOut()}>Sign Out</button>
      </div>
    )
  }
  
  return (
    <button onClick={() => signIn('email@example.com', 'password')}>
      Sign In
    </button>
  )
}
```

### Database Operations

```tsx
import { db } from '@/lib/supabase-utils'

// Select data
const { data, error } = await db.select('users')

// Insert data
const { data, error } = await db.insert('users', {
  email: 'user@example.com',
  full_name: 'John Doe'
})

// Update data
const { data, error } = await db.update('users', 'user-id', {
  full_name: 'Jane Doe'
})

// Delete data
const { data, error } = await db.delete('users', 'user-id')
```

### Direct Supabase Client

```tsx
import { supabase } from '@/lib/supabase'

// More complex queries
const { data, error } = await supabase
  .from('users')
  .select('*, posts(*)')
  .eq('active', true)
  .order('created_at', { ascending: false })
```

## Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security Notes

- The anon key is safe to use in client-side code
- Use Row Level Security (RLS) policies to protect your data
- Never expose your service role key in client-side code
- Always validate and sanitize user inputs

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that your `.env.local` file exists and has the correct variables
   - Restart your development server after adding environment variables

2. **Database connection errors**
   - Verify your project URL and API key are correct
   - Check that your database is running in the Supabase dashboard

3. **Authentication not working**
   - Verify your site URL is configured correctly in Supabase Auth settings
   - Check that you've enabled the authentication methods you're trying to use

4. **RLS policies blocking queries**
   - Review your Row Level Security policies
   - Test queries in the Supabase SQL editor first

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Next.js with Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

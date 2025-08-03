import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      groqKey: !!process.env.GROQ_API_KEY,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
      // Only show first few chars for security
      supabaseUrlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'Environment variables check',
      env: envCheck,
      allPresent: envCheck.supabaseUrl && envCheck.supabaseAnonKey && envCheck.supabaseServiceKey && envCheck.groqKey
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to check environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

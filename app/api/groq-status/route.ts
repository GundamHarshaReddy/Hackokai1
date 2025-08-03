import { NextResponse } from 'next/server'

export async function GET() {
  const isConfigured = !!process.env.GROQ_API_KEY
  
  return NextResponse.json({
    configured: isConfigured
  })
}

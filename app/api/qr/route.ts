import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('id')
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Production-ready QR redirect with environment detection
    
    // Get base URL from environment, defaulting to production
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackokai.vercel.app'
    
    // Only use localhost in true development environment
    const isLocalDevelopment = 
      process.env.NODE_ENV === 'development' && 
      !process.env.VERCEL && // Not on Vercel
      !process.env.RAILWAY_ENVIRONMENT && // Not on Railway
      !process.env.NETLIFY // Not on Netlify
    
    if (isLocalDevelopment) {
      baseUrl = 'http://localhost:3000'
    }
    
    console.log(`QR API - Environment: ${process.env.NODE_ENV}, VERCEL: ${!!process.env.VERCEL}, isLocalDev: ${isLocalDevelopment}, baseUrl: ${baseUrl}`)
    
    const jobUrl = `${baseUrl}/job/${jobId}`
    
    return NextResponse.redirect(jobUrl, { status: 302 })
  } catch (error) {
    console.error('QR redirect error:', error)
    return NextResponse.json(
      { error: 'Failed to redirect to job' },
      { status: 500 }
    )
  }
}

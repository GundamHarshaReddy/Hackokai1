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

    // Simple redirect to the job page
    const jobUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://hackokai.vercel.app'}/job/${jobId}`
    
    return NextResponse.redirect(jobUrl, { status: 302 })
  } catch (error) {
    console.error('QR redirect error:', error)
    return NextResponse.json(
      { error: 'Failed to redirect to job' },
      { status: 500 }
    )
  }
}

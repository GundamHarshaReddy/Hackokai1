import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    console.log('Fetching job with ID:', jobId)

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Get job from database
    const job = await dbOperations.getJobById(jobId)
    console.log('Job found:', job)

    if (!job) {
      console.log('Job not found in database for ID:', jobId)
      return NextResponse.json(
        { error: `Job not found for ID: ${jobId}` },
        { status: 404 }
      )
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

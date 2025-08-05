import { NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Fetching all jobs for debugging...')
    
    // Get all jobs to see what's in the database
    const jobs = await dbOperations.getJobs()
    
    console.log('Found jobs:', jobs?.length || 0)
    
    return NextResponse.json({
      success: true,
      totalJobs: jobs?.length || 0,
      jobs: jobs?.map((job: any) => ({
        id: job.id,
        company_name: job.company_name,
        job_title: job.job_title,
        created_at: job.created_at
      })) || []
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

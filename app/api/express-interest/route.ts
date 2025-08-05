import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { studentId, jobId, phone } = await request.json()

    // Validate required fields
    if (!studentId || !jobId || !phone) {
      return NextResponse.json(
        { error: 'Student ID, Job ID, and phone number are required' },
        { status: 400 }
      )
    }

    // Create job application
    const application = await dbOperations.createJobApplication({
      student_id: studentId,
      job_id: jobId,
      phone: phone,
      status: 'pending'
    })

    console.log('Job application created:', application)

    return NextResponse.json({
      success: true,
      message: 'Your interest has been recorded successfully!',
      application: {
        id: application.id,
        status: application.status,
        created_at: application.created_at
      }
    })

  } catch (error) {
    console.error('Error expressing interest:', error)
    
    // Handle duplicate application error
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { 
          error: 'You have already applied for this job',
          message: 'Your application is already on record for this position.'
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to record interest',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

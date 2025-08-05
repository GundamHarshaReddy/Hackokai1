import { NextRequest, NextResponse } from 'next/server'
import { generateQRCodeURL } from '@/lib/qr-generator'
import { dbOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const jobData = await request.json()

    // Validate required fields
    const requiredFields = ['contact_name', 'contact_number', 'company_name', 'job_title', 'job_type', 'job_description']
    const missingFields = requiredFields.filter(field => !jobData[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Prepare job data for database
    const jobForDb = {
      company_name: jobData.company_name,
      job_title: jobData.job_title,
      job_description: jobData.job_description,
      location: jobData.location || 'Remote',
      job_type: jobData.job_type,
      key_skills: jobData.key_skills || []
    }

    // Save job to database first to get the actual job ID
    console.log('Saving job to database:', jobForDb)
    const savedJob = await dbOperations.createJob(jobForDb)
    console.log('Job saved successfully:', savedJob)

    // Generate QR code URL using the actual saved job ID
    const qr_code_url = generateQRCodeURL(savedJob.id)

    return NextResponse.json({ 
      success: true, 
      job_id: savedJob.id,
      qr_code_url,
      message: 'Job posted successfully',
      job: savedJob
    })

  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

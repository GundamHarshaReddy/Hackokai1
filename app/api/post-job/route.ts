import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateJobId, generateQRCodeURL } from '@/lib/qr-generator'

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Generate job ID and QR code URL
    const job_id = generateJobId()
    const qr_code_url = generateQRCodeURL(job_id)

    // Prepare job data for insertion
    const jobToInsert = {
      job_id,
      contact_name: jobData.contact_name,
      contact_number: jobData.contact_number,
      company_name: jobData.company_name,
      job_title: jobData.job_title,
      job_type: jobData.job_type,
      job_description: jobData.job_description,
      location: jobData.location || null,
      salary_stipend: jobData.salary_stipend || null,
      key_skills: jobData.key_skills || [],
      qr_code_url,
    }

    // Use service role client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert(jobToInsert)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create job posting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      job: data,
      message: 'Job posted successfully!'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

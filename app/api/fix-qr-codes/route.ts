import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get all jobs with QR codes that point to localhost
    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, job_id, qr_code_url')
      .like('qr_code_url', '%localhost%')

    if (fetchError) {
      throw new Error(`Failed to fetch jobs: ${fetchError.message}`)
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No QR codes need updating',
        updated: 0
      })
    }

    // Update each job's QR code URL
    const updatePromises = jobs.map(async (job) => {
      const newQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://hackokai.vercel.app/job/${job.job_id}`)}&format=png`
      
      const { error } = await supabaseAdmin!
        .from('jobs')
        .update({ qr_code_url: newQrUrl })
        .eq('id', job.id)

      if (error) {
        console.error(`Failed to update job ${job.job_id}:`, error)
        return { job_id: job.job_id, success: false, error: error.message }
      }

      return { job_id: job.job_id, success: true }
    })

    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success)

    return NextResponse.json({
      success: true,
      message: `Updated ${successful} QR codes`,
      updated: successful,
      failed: failed.length,
      failures: failed
    })
  } catch (error) {
    console.error('QR code fix error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fix QR codes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

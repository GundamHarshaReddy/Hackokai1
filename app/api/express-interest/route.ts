import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, job_id, is_interested, fitment_score } = body

    if (!student_id || !job_id || typeof is_interested !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, job_id, is_interested' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Use service role client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('student_job_interests')
      .upsert({
        student_id,
        job_id,
        is_interested,
        fitment_score: fitment_score || null,
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to express interest' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
      message: 'Interest expressed successfully!'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, job_id } = body

    if (!student_id || !job_id) {
      return NextResponse.json(
        { error: 'Student ID and Job ID are required' },
        { status: 400 }
      )
    }

    // TODO: Implement fitment calculation without database
    return NextResponse.json({
      score: 0,
      details: 'Fitment calculation temporarily disabled'
    })

  } catch (error) {
    console.error('Error calculating fitment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    // Save student data using server-side service role
    const student = await dbHelpers.insertStudent(studentData)

    // Generate career recommendations
    const response = await fetch('http://localhost:3000/api/career-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    })

    if (!response.ok) {
      throw new Error('Failed to generate career recommendations')
    }

    const { recommendations } = await response.json()

    return NextResponse.json({
      success: true,
      student,
      recommendations
    })
  } catch (error: any) {
    console.error('Assessment submission error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to submit assessment',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

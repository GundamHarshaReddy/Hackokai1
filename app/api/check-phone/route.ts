import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (phone.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be 10 digits.' },
        { status: 400 }
      )
    }

    // Check if student exists with this phone number
    const student = await dbOperations.getStudentByPhone(phone)
    
    if (!student) {
      return NextResponse.json({
        exists: false,
        student_id: null,
        student_name: null,
        has_completed_assessment: false,
        student_data: null
      })
    }

    // Check if student has completed assessment (has career recommendations)
    const recommendations = await dbOperations.getCareerRecommendations(student.id)
    const hasCompletedAssessment = recommendations && recommendations.length > 0
    
    return NextResponse.json({
      exists: true,
      student_id: student.id,
      student_name: student.name,
      has_completed_assessment: hasCompletedAssessment,
      student_data: student
    })

  } catch (error) {
    console.error('Error checking phone number:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

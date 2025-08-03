import { NextRequest, NextResponse } from 'next/server'
import { dbHelpers } from '@/lib/supabase'
import { generateCareerRecommendations } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    // Save student data using server-side service role
    const student = await dbHelpers.insertStudent(studentData)

    // Generate career recommendations directly instead of making an API call
    const recommendations = await generateCareerRecommendations(studentData)

    return NextResponse.json({
      success: true,
      student,
      recommendations
    })
  } catch (error: unknown) {
    console.error('Assessment submission error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to submit assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

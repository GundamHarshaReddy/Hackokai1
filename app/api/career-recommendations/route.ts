import { NextRequest, NextResponse } from 'next/server'
import { generateCareerRecommendations } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    if (!studentData) {
      return NextResponse.json(
        { error: 'Student data is required' },
        { status: 400 }
      )
    }

    const recommendations = await generateCareerRecommendations(studentData)
    
    return NextResponse.json({
      success: true,
      recommendations
    })
  } catch (error: unknown) {
    console.error('Career recommendations API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate career recommendations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateCareerRecommendations } from '@/lib/openai'
import { dbOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    if (!studentData) {
      return NextResponse.json(
        { error: 'Student data is required' },
        { status: 400 }
      )
    }

    // Generate career recommendations using OpenAI
    const recommendations = await generateCareerRecommendations(studentData)

    // If student has an ID, save the recommendations to database
    if (studentData.id) {
      try {
        const recommendationsToSave = recommendations.map(rec => ({
          role: rec.role,
          match_score: rec.match,
          fitment_score: rec.match, // Same as match_score for compatibility
          explanation: rec.explanation,
          job_openings: rec.openings || 0
        }))

        await dbOperations.saveCareerRecommendations(studentData.id, recommendationsToSave)
      } catch (dbError) {
        console.error('Failed to save recommendations to database:', dbError)
        // Continue without failing the request
      }
    }
    
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

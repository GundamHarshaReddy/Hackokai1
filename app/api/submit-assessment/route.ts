import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'
import { generateCareerRecommendations } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const studentData = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'education_degree', 'specialization', 'core_values', 'work_preferences', 'personality_scores']
    for (const field of requiredFields) {
      if (!studentData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Check if student already exists by email or phone
    const existingByEmail = await dbOperations.getStudentByEmail(studentData.email)
    const existingByPhone = await dbOperations.getStudentByPhone(studentData.phone)

    let student

    if (existingByEmail) {
      // Update existing student by email
      student = await dbOperations.updateStudent(existingByEmail.id, studentData)
    } else if (existingByPhone) {
      // Update existing student by phone
      student = await dbOperations.updateStudent(existingByPhone.id, studentData)
    } else {
      // Create new student
      student = await dbOperations.createStudent(studentData)
    }

    // Generate career recommendations using OpenAI
    const recommendations = await generateCareerRecommendations(studentData)

    // Save career recommendations to database
    if (recommendations && recommendations.length > 0) {
      const recommendationsToSave = recommendations.map(rec => ({
        role: rec.role,
        match_score: rec.match,
        fitment_score: rec.match, // Same as match_score for compatibility
        explanation: rec.explanation,
        job_openings: rec.openings || 0
      }))

      await dbOperations.saveCareerRecommendations(student.id, recommendationsToSave)
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully',
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone
      },
      recommendations
    })
  } catch (error: unknown) {
    console.error('Assessment submission error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

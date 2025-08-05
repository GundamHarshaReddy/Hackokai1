import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Get student data
    const student = await dbOperations.getStudentById(studentId)
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get career recommendations
    const recommendations = await dbOperations.getCareerRecommendations(studentId)
    
    // Get job interests
    const jobInterests = await dbOperations.getJobInterests(studentId)

    // Generate LLM summary
    if (!openai) {
      return NextResponse.json({
        student,
        summary: "AI summary generation is not available. OpenAI API is not configured.",
        stats: {
          recommendations_count: recommendations?.length || 0,
          job_interests_count: jobInterests?.length || 0,
          profile_completion: calculateProfileCompletion(student)
        }
      })
    }

    const prompt = `
    Generate a professional summary for this student profile:
    
    Student Information:
    - Name: ${student.name}
    - Email: ${student.email}
    - Phone: ${student.phone}
    - Education: ${student.education_degree}
    - Specialization: ${student.specialization}
    - Core Values: ${student.core_values?.join(', ') || 'Not specified'}
    
    Career Recommendations: ${recommendations?.length || 0} recommendations available
    ${recommendations?.map(rec => `- ${rec.career_title}: ${rec.match_percentage}% match`).join('\n') || 'No recommendations yet'}
    
    Job Interests: ${jobInterests?.length || 0} jobs of interest
    
    Please provide:
    1. A professional summary (2-3 sentences)
    2. Key strengths based on their profile
    3. Recommended career paths
    4. Areas for development
    
    Keep it concise and professional.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a career counselor providing professional student profile summaries for administrative review."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const summary = completion.choices[0]?.message?.content || "Unable to generate summary at this time."

    return NextResponse.json({
      student,
      summary,
      stats: {
        recommendations_count: recommendations?.length || 0,
        job_interests_count: jobInterests?.length || 0,
        profile_completion: calculateProfileCompletion(student)
      }
    })

  } catch (error) {
    console.error('Error generating student summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate student summary' },
      { status: 500 }
    )
  }
}

function calculateProfileCompletion(student: {
  name?: string;
  email?: string;
  phone?: string;
  education_degree?: string;
  specialization?: string;
  [key: string]: unknown;
}): number {
  const fields = ['name', 'email', 'phone', 'education_degree', 'specialization']
  const filledFields = fields.filter(field => {
    const value = student[field]
    return value && typeof value === 'string' && value.trim() !== ''
  })
  return Math.round((filledFields.length / fields.length) * 100)
}

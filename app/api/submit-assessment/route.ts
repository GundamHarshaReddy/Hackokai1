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
    
    // Handle specific database constraint errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for duplicate email constraint
    if (errorMessage.includes('students_email_key') || errorMessage.includes('duplicate key value violates unique constraint')) {
      if (errorMessage.includes('email')) {
        return NextResponse.json(
          { 
            error: 'Email already exists',
            message: 'This email address is already registered. Please use a different email address.'
          },
          { status: 400 }
        )
      }
    }
    
    // Check for duplicate phone constraint
    if (errorMessage.includes('students_phone_key') || (errorMessage.includes('duplicate') && errorMessage.includes('phone'))) {
      return NextResponse.json(
        { 
          error: 'Phone number already exists',
          message: 'This phone number is already registered. Please use a different phone number.'
        },
        { status: 400 }
      )
    }
    
    // Check for other validation errors
    if (errorMessage.includes('violates check constraint') || errorMessage.includes('invalid input')) {
      return NextResponse.json(
        { 
          error: 'Invalid data',
          message: 'Please check your input data and try again.'
        },
        { status: 400 }
      )
    }
    
    // Generic server error
    return NextResponse.json(
      { 
        error: 'Failed to submit assessment',
        message: 'An unexpected error occurred. Please try again later.',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

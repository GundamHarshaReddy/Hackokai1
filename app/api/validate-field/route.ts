import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { field, value } = await request.json()

    if (!field || !value) {
      return NextResponse.json(
        { error: 'Field and value are required' },
        { status: 400 }
      )
    }

    let existingRecord = null

    if (field === 'email') {
      existingRecord = await dbOperations.getStudentByEmail(value)
    } else if (field === 'phone') {
      existingRecord = await dbOperations.getStudentByPhone(value)
    } else {
      return NextResponse.json(
        { error: 'Invalid field type. Only email and phone are supported.' },
        { status: 400 }
      )
    }

    if (existingRecord) {
      return NextResponse.json({
        valid: false,
        error: field === 'email' ? 'Email already exists' : 'Phone number already exists',
        message: `This ${field} is already registered. Please use a different ${field}.`
      })
    }

    return NextResponse.json({
      valid: true,
      message: `${field} is available`
    })

  } catch (error) {
    console.error('Error validating field:', error)
    return NextResponse.json(
      { 
        valid: true, // Don't block user on validation errors
        error: 'Validation service temporarily unavailable',
        message: 'Unable to verify availability. Please continue.'
      },
      { status: 200 }
    )
  }
}

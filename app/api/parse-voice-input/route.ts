import { NextRequest, NextResponse } from 'next/server'
import { generateAIResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    // Create a structured prompt for OpenAI to extract job posting information
    const prompt = `
You are a professional job posting parser. Extract the following information from this voice transcript and return ONLY a valid JSON object (no extra text or explanations):

Voice Transcript: "${transcript}"

Return a JSON object with these exact fields:
{
  "contact_name": "string",
  "contact_number": "string (format with country code if mentioned, otherwise as given)",
  "contact_email": "string (empty string if not mentioned)",
  "company_name": "string",
  "job_title": "string", 
  "job_type": "string (Full-Time, Part-Time, Internship, Freelance, or Contract)",
  "location": "string (add country if not specified)",
  "salary_stipend": "string (include currency and time period if mentioned, empty string if not mentioned)",
  "key_skills": ["array of strings, empty array if not mentioned"],
  "job_description": "string (the main job requirements/description)"
}

IMPORTANT: 
- Return ONLY the JSON object, no other text
- Extract information exactly as spoken
- If something is not mentioned, use empty string or empty array
- For phone numbers, format with country code if country is mentioned
- For salary, include currency and time period if mentioned
`

    // Generate AI response to parse the voice input
    const aiResponse = await generateAIResponse(prompt)
    
    let parsedData
    try {
      // First try to extract JSON from the response if it contains extra text
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: try parsing the entire response
        parsedData = JSON.parse(aiResponse)
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('AI Response:', aiResponse)
      
      return NextResponse.json(
        { error: 'Failed to parse voice input. Please try speaking more clearly or fill the form manually.' },
        { status: 500 }
      )
    }

    // Validate that we have the expected structure
    const requiredFields = ['contact_name', 'contact_number', 'contact_email', 'company_name', 'job_title', 'job_type', 'location', 'salary_stipend', 'key_skills', 'job_description']
    const validatedData: Record<string, unknown> = {}
    
    for (const field of requiredFields) {
      if (field === 'key_skills') {
        validatedData[field] = Array.isArray(parsedData[field]) ? parsedData[field] : []
      } else {
        validatedData[field] = parsedData[field] || ''
      }
    }

    console.log('Parsed voice input:', validatedData)

    return NextResponse.json({
      success: true,
      data: validatedData,
      originalTranscript: transcript
    })

  } catch (error) {
    console.error('Voice parsing error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process voice input',
        message: 'Please try again or fill the form manually.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { generateCareerRecommendations } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    console.log('Parsing voice transcript:', transcript)

    // Use AI to parse the voice input into structured job data
    const prompt = `
You are a voice input parser for a job posting form. Parse the following voice transcript and extract job information into a JSON format. Only extract information that is clearly mentioned. Leave fields empty if not clearly stated.

Voice Transcript: "${transcript}"

Please extract and return ONLY a valid JSON object with these fields:
{
  "contact_name": "string or null",
  "contact_number": "string or null", 
  "company_name": "string or null",
  "job_title": "string or null",
  "job_type": "Full-Time/Part-Time/Internship/Freelance or null",
  "location": "string or null",
  "salary_stipend": "string or null",
  "key_skills": ["array of skill strings or empty array"],
  "job_description": "string or null"
}

Guidelines:
- Extract phone numbers in clean format (remove extra spaces/dashes)
- For job_type, only use: "Full-Time", "Part-Time", "Internship", or "Freelance"
- For key_skills, extract technology/skill names as separate array items
- For job_description, extract the main job requirements/responsibilities
- If name includes titles like Mr/Ms/Dr, include them
- Return only the JSON object, no other text

Example response:
{
  "contact_name": "John Doe",
  "contact_number": "9876543210",
  "company_name": "TechCorp Solutions",
  "job_title": "Software Developer",
  "job_type": "Full-Time",
  "location": "Bangalore",
  "salary_stipend": "50000 per month",
  "key_skills": ["JavaScript", "React", "Node.js"],
  "job_description": "We need a developer to build web applications with modern frameworks"
}
`

    const parsedText = await generateCareerRecommendations(prompt)

    console.log('AI Response:', parsedText)

    // Try to extract JSON from the response
    let parsedData
    try {
      // Look for JSON object in the response
      const responseText = Array.isArray(parsedText) ? parsedText.join(' ') : String(parsedText)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      
      // Fallback to manual parsing
      parsedData = {
        contact_name: extractField(transcript, [
          /(?:my name is|i am|this is|i'm|call me)\s+([a-z\s]{2,30})/i,
          /(?:contact person|person is|contact is)\s+([a-z\s]{2,30})/i,
        ]),
        contact_number: extractField(transcript, [
          /(?:phone|number|mobile|contact).*?([+]?[0-9\s\-()]{8,15})/i,
          /\b([0-9]{10})\b/,
        ]),
        company_name: extractField(transcript, [
          /(?:company|from|work at|represent)\s+([a-z\s&.]{2,30})/i,
          /(?:we are|i'm with)\s+([a-z\s&.]{2,30})/i,
        ]),
        job_title: extractField(transcript, [
          /(?:job title|position|role|hiring for|looking for)\s+(?:is\s+)?([a-z\s]{3,30})/i,
          /(?:need|want|seeking)\s+(?:a|an)?\s*([a-z\s]{3,30})\s+(?:position|role|developer|engineer|manager|analyst)/i,
        ]),
        job_type: extractJobType(transcript),
        location: extractField(transcript, [
          /(?:location|based in|located in|office in|work from)\s+([a-z\s,]{2,30})/i,
          /(?:in|at)\s+(bangalore|mumbai|delhi|chennai|hyderabad|pune|kolkata|ahmedabad)/i,
        ]),
        salary_stipend: extractField(transcript, [
          /(?:salary|stipend|pay|package).*?([0-9,]+\s*(?:per month|monthly|thousand|lakh|k|rupees|rs))/i,
        ]),
        key_skills: extractSkills(transcript),
        job_description: extractDescription(transcript),
      }
    }

    console.log('Parsed job data:', parsedData)

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('Voice parsing error:', error)
    return NextResponse.json({ error: 'Failed to parse voice input' }, { status: 500 })
  }
}

function extractField(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const result = match[1].trim().replace(/\b(and|from|at|phone|number|company)\b.*/i, '').trim()
      if (result.length > 1) {
        return result
      }
    }
  }
  return null
}

function extractJobType(text: string): string | null {
  const lower = text.toLowerCase()
  if (lower.includes('intern') || lower.includes('internship')) {
    return 'Internship'
  } else if (lower.includes('full time') || lower.includes('permanent')) {
    return 'Full-Time'
  } else if (lower.includes('freelance') || lower.includes('contract') || lower.includes('part time')) {
    return 'Freelance'
  }
  return null
}

function extractSkills(text: string): string[] {
  const skillsPattern = /(?:skills|technologies|tech stack|experience in|know|familiar with|use)\s+(?:are|required|like)?\s*([a-z\s,&.+#-]+?)(?:\s(?:and|experience|knowledge|job description|description))/i
  const match = text.match(skillsPattern)
  if (match && match[1]) {
    return match[1]
      .split(/,|\s+and\s+|\s+or\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 1 && !['the', 'and', 'or', 'with'].includes(s.toLowerCase()))
      .slice(0, 8)
  }
  return []
}

function extractDescription(text: string): string | null {
  const descriptionPattern = /(?:job description|description)\s+(?:is\s+)?(.+?)(?:\s*$)/i
  const match = text.match(descriptionPattern)
  if (match && match[1]) {
    return match[1].trim()
  }
  return null
}

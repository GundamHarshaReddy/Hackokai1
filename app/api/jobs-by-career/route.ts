import { NextRequest, NextResponse } from "next/server"
import { dbOperations } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const careerType = searchParams.get("careerType")

    if (!careerType) {
      return NextResponse.json({ error: "Career type is required" }, { status: 400 })
    }

    console.log(`Fetching jobs for career type: ${careerType}`)
    
    // Fetch jobs from database
    const jobs = await dbOperations.getJobsByCareer(careerType)
    
    console.log(`Found ${jobs.length} jobs for career type: ${careerType}`)
    
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error fetching jobs by career type:", error)
    return NextResponse.json(
      { error: "Failed to fetch jobs", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

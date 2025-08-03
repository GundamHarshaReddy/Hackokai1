"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Clock, Phone, Heart, Calculator } from "lucide-react"
import { type Job, type Student, dbHelpers } from "@/lib/supabase"
import { calculateFitmentScore } from "@/lib/groq"
import { useRouter } from "next/navigation"

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [job, setJob] = useState<Job | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPhoneInput, setShowPhoneInput] = useState(true)
  const [fitmentScore, setFitmentScore] = useState<{
    score: number;
    reasoning: string;
    matched_skills: string[];
    missing_skills: string[];
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [expressing, setExpressing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        // Check if environment variables are available
        if (typeof window !== 'undefined') {
          console.log("Environment check:", {
            supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          })
        }

        const job = await dbHelpers.getJobByJobId(resolvedParams.jobId)
        if (!job) {
          console.error("Job not found for ID:", resolvedParams.jobId)
          setError(`Job not found for ID: ${resolvedParams.jobId}`)
        }
        setJob(job)
      } catch (error) {
        console.error("Error fetching job:", error)
        console.error("Job ID:", resolvedParams.jobId)
        setError(error instanceof Error ? error.message : "Failed to load job")
      } finally {
        setLoading(false)
      }
    }
    
    if (resolvedParams?.jobId) {
      fetchJob()
    } else {
      console.error("No job ID provided")
      setError("No job ID provided")
      setLoading(false)
    }
  }, [resolvedParams.jobId])

  const checkPhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number")
      return
    }

    try {
      const student = await dbHelpers.getStudentByPhone(phoneNumber.trim())
      if (!student) {
        router.push(`/student/assessment?redirect=/job/${resolvedParams.jobId}&phone=${encodeURIComponent(phoneNumber)}`)
        return
      }
      setStudent(student)
      setShowPhoneInput(false)
    } catch (error) {
      console.error("Error checking phone number:", error)
      console.error("Phone number:", phoneNumber.trim())
      router.push(`/student/assessment?redirect=/job/${resolvedParams.jobId}&phone=${encodeURIComponent(phoneNumber)}`)
    }
  }

  const calculateFitment = async () => {
    if (!student || !job) {
      console.error("Missing student or job data:", { student: !!student, job: !!job })
      return
    }

    setCalculating(true)
    try {
      const result = await calculateFitmentScore(student, job)
      setFitmentScore(result)

      // Save fitment score to database
      await dbHelpers.upsertStudentJobInterest({
        student_id: student.id,
        job_id: job.id,
        fitment_score: result.score,
        is_interested: false,
      })
    } catch (error) {
      console.error("Error calculating fitment:", error)
      console.error("Student ID:", student?.id)
      console.error("Job ID:", job?.id)
      alert("Error calculating fitment score. Please try again.")
    } finally {
      setCalculating(false)
    }
  }

  const expressInterest = async () => {
    if (!student || !job) return

    setExpressing(true)
    try {
      const response = await fetch('/api/express-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: student.id,
          job_id: job.id,
          is_interested: true,
          fitment_score: fitmentScore?.score,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to express interest')
      }

      alert("Interest expressed successfully! The company will be notified.")
    } catch (error) {
      console.error("Error expressing interest:", error)
      alert("Error expressing interest. Please try again.")
    } finally {
      setExpressing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading job details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Job</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600">The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {showPhoneInput ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Enter Your Phone Number</CardTitle>
              <CardDescription>
                We need your phone number to check your profile and calculate job fitment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button onClick={checkPhoneNumber} className="w-full">
                <Phone className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Job Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{job.job_title}</CardTitle>
                    <CardDescription className="flex items-center mt-2 text-lg">
                      <Building2 className="h-5 w-5 mr-2" />
                      {job.company_name}
                    </CardDescription>
                  </div>
                  <Badge variant={job.job_type === "Internship" ? "secondary" : "default"} className="text-sm">
                    {job.job_type}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Job Details */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.job_description}</p>
                  </CardContent>
                </Card>

                {job.key_skills && job.key_skills.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Key Skills Required</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {job.key_skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {/* Job Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {job.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        {job.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </div>
                    {job.salary_stipend && (
                      <div className="text-sm">
                        <span className="font-medium">Compensation:</span> {job.salary_stipend}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Fitment Score */}
                {fitmentScore && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">Your Fitment Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-green-600">{fitmentScore.score}%</div>
                        <div className="text-sm text-green-700">Match</div>
                      </div>
                      <p className="text-sm text-green-800">{fitmentScore.reasoning}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button onClick={calculateFitment} disabled={calculating} className="w-full">
                    <Calculator className="mr-2 h-4 w-4" />
                    {calculating ? "Calculating..." : "Check Fitment Score"}
                  </Button>

                  <Button
                    onClick={expressInterest}
                    disabled={expressing}
                    variant="outline"
                    className="w-full bg-transparent"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    {expressing ? "Expressing..." : "I am Interested"}
                  </Button>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Contact Person:</span> {job.contact_name}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Phone:</span> {job.contact_number}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

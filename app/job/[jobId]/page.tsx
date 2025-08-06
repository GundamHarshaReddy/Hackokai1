"use client"

import { useState, useEffect, use, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, MapPin, Clock, Phone, ArrowLeft, Star, CheckCircle, AlertCircle, XCircle, Heart, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { dbOperations } from '@/lib/supabase'
import PhoneVerificationModal from '@/components/PhoneVerificationModal'

interface Job {
  id: string
  company_name: string
  job_title: string
  job_description: string
  location: string
  job_type: string
  key_skills: string[]
  created_at: string
}

interface Student {
  id: string
  name: string
  email: string
  phone: string
  education_degree: string
  specialization: string
  core_values: string[]
  work_preferences: string[]
  personality_scores: Record<string, number>
}

interface Recommendation {
  role: string
  match: number
  match_score?: number
  explanation: string
  openings?: number
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [job, setJob] = useState<Job | null>(null)
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [fitmentScore, setFitmentScore] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [isExpressingInterest, setIsExpressingInterest] = useState(false)
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false)

  const loadStudentFromSession = () => {
    try {
      const studentData = sessionStorage.getItem('currentStudent')
      if (studentData) {
        setCurrentStudent(JSON.parse(studentData))
      }
    } catch (error) {
      console.error('Error loading student data:', error)
    }
  }

  const loadJobDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      
      // Try the dynamic route first, fallback to query parameter route
      let response = await fetch(`/api/jobs/${resolvedParams.jobId}`)
      
      // If dynamic route fails, try the query parameter approach
      if (!response.ok && response.status === 404) {
        response = await fetch(`/api/job-by-id?id=${resolvedParams.jobId}`)
      }
      
      if (response.ok) {
        const jobData = await response.json()
        setJob(jobData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Job not found')
      }
    } catch (err) {
      console.error('Error loading job details:', err)
      setError('Failed to load job details. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.jobId])

  const calculateFitmentScore = useCallback(async () => {
    if (!currentStudent || !job) return

    try {
      // Get career recommendations for this student
      const recommendationsData = await dbOperations.getCareerRecommendations(currentStudent.id)
      console.log('Career Recommendations Data:', recommendationsData) // Debug log
      setRecommendations(recommendationsData)
      
      if (recommendationsData.length === 0) {
        console.log('No career recommendations found for student') // Debug log
        setFitmentScore(0)
        return
      }

      // Find the best matching recommendation
      let bestMatch = 0
      console.log('Looking for matches for job title:', job.job_title) // Debug log
      
      recommendationsData.forEach(rec => {
        const roleMatch = job.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                         rec.role.toLowerCase().includes(job.job_title.toLowerCase())
        
        console.log(`Comparing "${rec.role}" with "${job.job_title}": ${roleMatch ? 'MATCH' : 'NO MATCH'}, Score: ${rec.match_score}`) // Debug log
        
        if (roleMatch) {
          // Use match_score instead of fitment_score
          bestMatch = Math.max(bestMatch, rec.match_score || 0)
        }
      })

      console.log('Best direct match score:', bestMatch) // Debug log

      // If no direct role match, calculate based on skills overlap
      if (bestMatch === 0 && job.key_skills && job.key_skills.length > 0) {
        console.log('No direct match found, calculating based on skills overlap') // Debug log
        
        // Extract skills from recommendation explanations
        const studentSkills = recommendationsData.flatMap(rec => {
          if (!rec.explanation) return []
          
          // Better skill extraction from explanations
          const skillKeywords = ['analytical', 'programming', 'communication', 'leadership', 'creative', 
                                'technical', 'management', 'data', 'design', 'marketing', 'sales',
                                'problem-solving', 'teamwork', 'organization', 'research']
          
          return skillKeywords.filter(skill => 
            rec.explanation.toLowerCase().includes(skill)
          )
        }).filter(skill => skill.length > 2)
        
        console.log('Extracted student skills:', studentSkills) // Debug log
        console.log('Job required skills:', job.key_skills) // Debug log
        
        const jobSkills = job.key_skills.map(skill => skill.toLowerCase())
        const matchingSkills = jobSkills.filter(jobSkill => 
          studentSkills.some(studentSkill => 
            studentSkill.includes(jobSkill) || jobSkill.includes(studentSkill)
          )
        )
        
        console.log('Matching skills:', matchingSkills) // Debug log
        
        // Calculate based on skill overlap and average recommendation scores
        const avgRecommendationScore = recommendationsData.reduce((sum, rec) => sum + (rec.match_score || 0), 0) / recommendationsData.length
        const skillOverlapRatio = matchingSkills.length / jobSkills.length
        
        console.log('Average recommendation score:', avgRecommendationScore) // Debug log
        console.log('Skill overlap ratio:', skillOverlapRatio) // Debug log
        
        bestMatch = Math.round(Math.min(85, (avgRecommendationScore * 0.7) + (skillOverlapRatio * 30)))
        console.log('Calculated skill-based match score:', bestMatch) // Debug log
      }

      // Ensure minimum score for any job (even poor matches should show some score)
      if (bestMatch === 0 && recommendationsData.length > 0) {
        console.log('Applying minimum score fallback') // Debug log
        const avgScore = recommendationsData.reduce((sum, rec) => sum + (rec.match_score || 0), 0) / recommendationsData.length
        bestMatch = Math.max(15, Math.round(avgScore * 0.3)) // Minimum 15% for any job
        console.log('Minimum fallback score:', bestMatch) // Debug log
      }

      console.log('Final fitment score:', bestMatch) // Debug log
      setFitmentScore(Math.round(bestMatch))
    } catch (error) {
      console.error('Error calculating fitment score:', error)
      setFitmentScore(0)
    }
  }, [currentStudent, job])

  useEffect(() => {
    loadJobDetails()
    loadStudentFromSession()
  }, [loadJobDetails])

  useEffect(() => {
    if (job && currentStudent) {
      calculateFitmentScore()
    }
  }, [job, currentStudent, calculateFitmentScore])

  const getFitmentColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getFitmentIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (score >= 60) return <Star className="h-5 w-5 text-yellow-600" />
    if (score >= 40) return <AlertCircle className="h-5 w-5 text-orange-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getFitmentMessage = (score: number) => {
    if (score >= 80) return "Excellent Match! You are highly suited for this role."
    if (score >= 60) return "Good Match! You meet most requirements for this role."
    if (score >= 40) return "Partial Match! Consider developing additional skills."
    return "Limited Match! This role may require significant skill development."
  }

  const getRecommendation = (score: number) => {
    if (score >= 60) return "We recommend applying for this position through the company's official website or contact them directly."
    return "Consider gaining more experience in the required skills before applying."
  }

  const handleInterestClick = () => {
    if (!currentStudent) {
      setShowPhoneModal(true)
    } else {
      expressInterest()
    }
  }

  const handlePhoneVerificationSuccess = (studentData: Student) => {
    setCurrentStudent(studentData)
    sessionStorage.setItem('currentStudent', JSON.stringify(studentData))
    setShowPhoneModal(false)
    // Recalculate fitment score with new student data
    if (job) {
      calculateFitmentScore()
    }
  }

  const handleNewStudent = () => {
    setShowPhoneModal(false)
    window.location.href = '/student/assessment'
  }

  const expressInterest = async () => {
    if (!currentStudent || !job) return

    setIsExpressingInterest(true)
    try {
      const response = await fetch('/api/express-interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentStudent.id,
          jobId: job.id,
          phone: currentStudent.phone
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setHasExpressedInterest(true)
        alert('Great! Your interest has been recorded successfully. The company will review your profile and may contact you soon.')
      } else {
        throw new Error(data.error || 'Failed to express interest')
      }
    } catch (error) {
      console.error('Error expressing interest:', error)
      alert('Sorry, there was an error recording your interest. Please try again.')
    } finally {
      setIsExpressingInterest(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 sm:gap-4 py-4 sm:py-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Job Details</h1>
            <p className="text-sm sm:text-base text-gray-600">Complete job information and personalized analysis</p>
          </div>
        </div>

        {/* Fitment Score Card */}
        {currentStudent && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getFitmentIcon(fitmentScore)}
                Your Fitment Score: {fitmentScore}%
              </CardTitle>
              <CardDescription>
                Based on your career assessment and this job&apos;s requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={fitmentScore} className="h-3" />
                <div className={`text-sm font-medium ${getFitmentColor(fitmentScore)}`}>
                  {getFitmentMessage(fitmentScore)}
                </div>
                <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                  <strong>Recommendation:</strong> {getRecommendation(fitmentScore)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interest Button */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-center space-y-3 sm:space-y-4">
              <Heart className="h-8 w-8 sm:h-12 sm:w-12 text-green-600 mx-auto" />
              <h3 className="text-lg sm:text-xl font-semibold text-green-800">
                Interested in this opportunity?
              </h3>
              <p className="text-sm sm:text-base text-green-700 mb-4 px-2">
                {currentStudent 
                  ? "Express your interest and let the company know you're interested!"
                  : "Enter your phone number to express interest and see your personalized fitment score"
                }
              </p>
              <Button
                onClick={handleInterestClick}
                disabled={isExpressingInterest || hasExpressedInterest}
                className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-2 text-sm sm:text-lg w-full sm:w-auto"
                size="default"
              >
                {isExpressingInterest ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : hasExpressedInterest ? (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Interest Recorded!
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {currentStudent ? 'I am Interested' : 'Express Interest'}
                  </>
                )}
              </Button>
              {hasExpressedInterest && (
                <p className="text-xs sm:text-sm text-green-600 bg-white p-2 rounded mx-2">
                  ✅ Your interest has been recorded. The company may contact you soon!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-xs sm:text-sm text-gray-600">{job.company_name}</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-blue-800">{job.job_title}</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-base">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {job.job_type}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-base sm:text-lg">Job Description</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {job.job_description}
              </p>
            </div>

            {job.key_skills && job.key_skills.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-base sm:text-lg">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.key_skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs sm:text-sm py-1 px-2 sm:px-3">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-xs text-gray-500">
                Job posted: {new Date(job.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Career Recommendations */}
        {currentStudent && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Career Profile Match</CardTitle>
              <CardDescription>
                How this job aligns with your career assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.slice(0, 3).map((rec, index) => {
                  const isMatch = job.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                                 rec.role.toLowerCase().includes(job.job_title.toLowerCase())
                  
                  return (
                    <div key={index} className={`p-3 rounded-lg border ${isMatch ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{rec.role}</h4>
                        <div className="flex items-center gap-2">
                          {isMatch && <CheckCircle className="h-4 w-4 text-green-600" />}
                          <Badge variant={isMatch ? "default" : "secondary"}>
                            {rec.match_score || 0}% fit
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{rec.explanation}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Profile Message */}
        {!currentStudent && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6 text-center">
              <Phone className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Get Your Personalized Fitment Score
              </h3>
              <p className="text-yellow-700 mb-4">
                Enter your phone number on the opportunities page to see how well this job matches your career profile.
              </p>
              <Button 
                onClick={() => router.push('/student/opportunities')}
                variant="outline"
              >
                Go to Opportunities
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Application Guidance */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Ready to Apply?
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>• Visit the company&apos;s official website to find their careers page</p>
              <p>• Prepare a tailored resume highlighting relevant skills</p>
              <p>• Write a cover letter explaining your interest in this specific role</p>
              <p>• Follow up professionally after submitting your application</p>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Company:</strong> {job.company_name} <br />
                <strong>Position:</strong> {job.job_title}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onVerificationSuccess={handlePhoneVerificationSuccess}
        onNewStudent={handleNewStudent}
      />
    </div>
  )
}

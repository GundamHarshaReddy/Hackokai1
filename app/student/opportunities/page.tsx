"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Building2, MapPin, Clock, Phone, X, CheckCircle, Star, AlertCircle, XCircle, Heart } from "lucide-react"
import { dbOperations } from '@/lib/supabase'

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

export default function OpportunitiesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [fitmentScore, setFitmentScore] = useState<number>(0)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [calculatingFitment, setCalculatingFitment] = useState(false)
  const [currentCareerFilter, setCurrentCareerFilter] = useState<string>('')
  const [interestedJobs, setInterestedJobs] = useState<string[]>([])
  const [sessionLoaded, setSessionLoaded] = useState(false)

  // Get career type filter from URL params
  const careerTypeFilter = searchParams.get('careerType')

  useEffect(() => {
    console.log('OpportunitiesPage mounted, loading initial data...')
    loadJobs()
    loadStudentFromSession()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, searchTerm, careerTypeFilter])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showJobDetails) {
        setShowJobDetails(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showJobDetails])

  const loadStudentFromSession = async () => {
    try {
      // Only access sessionStorage on the client
      if (typeof window === 'undefined') {
        setSessionLoaded(true)
        return
      }
      
      const studentData = sessionStorage.getItem('currentStudent')
      console.log('Session storage data:', studentData)
      
      if (studentData) {
        const student = JSON.parse(studentData)
        console.log('Parsed student from session:', student)
        setCurrentStudent(student)
        
        // Load career recommendations for this student
        const recommendationsData = await dbOperations.getCareerRecommendations(student.id)
        console.log('Career Recommendations loaded from session:', recommendationsData)
        setRecommendations(recommendationsData)
        
        // Load job interests from database
        try {
          const interestsData = await dbOperations.getJobInterests(student.id)
          const interestedJobIds = interestsData.map(interest => interest.job_id)
          setInterestedJobs(interestedJobIds)
          console.log('Job interests loaded:', interestedJobIds)
        } catch (interestError) {
          console.warn('Could not load job interests (table may not exist):', interestError)
          // Continue without job interests if table doesn't exist
          setInterestedJobs([])
        }
      } else {
        console.log('No student data found in session storage')
      }
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setSessionLoaded(true)
    }
  }

  const loadJobs = async () => {
    try {
      setLoading(true)
      setError("")
      
      let jobsData: Job[]
      
      if (careerTypeFilter) {
        // If coming from career recommendations, filter by career type
        jobsData = await dbOperations.getJobsByCareer(careerTypeFilter)
      } else {
        // Otherwise load all jobs
        jobsData = await dbOperations.getJobs()
      }
      
      setJobs(jobsData)
    } catch (err) {
      console.error('Error loading jobs:', err)
      setError('Failed to load job opportunities. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(job => 
        job.job_title.toLowerCase().includes(searchLower) ||
        job.company_name.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.key_skills.some(skill => skill.toLowerCase().includes(searchLower))
      )
    }

    setFilteredJobs(filtered)
  }

  const handleSearch = () => {
    filterJobs()
  }

  const clearCareerFilter = () => {
    setCurrentCareerFilter('')
    setFilteredJobs(jobs)
  }

  const handleInterestToggle = async (jobId: string) => {
    if (!currentStudent) {
      setError('Please complete your assessment first to save interests.')
      return
    }

    try {
      const isCurrentlyInterested = interestedJobs.includes(jobId)
      
      if (isCurrentlyInterested) {
        // Remove interest from database and local state
        console.log(`Attempting to remove interest for student ${currentStudent.id} and job ${jobId}`)
        await dbOperations.removeJobInterest(currentStudent.id, jobId)
        setInterestedJobs(prev => prev.filter(id => id !== jobId))
        console.log(`Successfully removed interest in job ${jobId}`)
      } else {
        // Add interest to database and local state
        console.log(`Attempting to add interest for student ${currentStudent.id} and job ${jobId}`)
        await dbOperations.addJobInterest(currentStudent.id, jobId)
        setInterestedJobs(prev => [...prev, jobId])
        console.log(`Successfully added interest in job ${jobId}`)
      }
    } catch (error) {
      console.error('Error toggling job interest:', error)
      
      // More specific error handling
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message
        if (errorMessage.includes('relation "job_interests" does not exist')) {
          setError('Database table not found. Please create the job_interests table first.')
        } else if (errorMessage.includes('violates foreign key constraint')) {
          setError('Invalid student or job ID. Please refresh and try again.')
        } else {
          setError(`Database error: ${errorMessage}`)
        }
      } else {
        setError('Failed to save your interest. Please try again.')
      }
    }
  }

  const handlePhoneSubmit = async () => {
    if (!phoneNumber.trim()) return
    
    try {
      setLoading(true)
      const student = await dbOperations.getStudentByPhone(phoneNumber.trim())
      
      if (student) {
        setCurrentStudent(student)
        sessionStorage.setItem('currentStudent', JSON.stringify(student))
        
        // Get career recommendations for this student
        const recommendations = await dbOperations.getCareerRecommendations(student.id)
        setRecommendations(recommendations)
        
        // Load job interests from database
        try {
          const interestsData = await dbOperations.getJobInterests(student.id)
          const interestedJobIds = interestsData.map(interest => interest.job_id)
          setInterestedJobs(interestedJobIds)
        } catch (interestError) {
          console.warn('Could not load job interests (table may not exist):', interestError)
          setInterestedJobs([])
        }
        
        if (recommendations.length > 0) {
          // Filter jobs based on career recommendations
          const recommendedRoles = recommendations.map(rec => rec.role)
          const matchingJobs = jobs.filter(job => 
            recommendedRoles.some(role => 
              job.job_title.toLowerCase().includes(role.toLowerCase()) ||
              role.toLowerCase().includes(job.job_title.toLowerCase())
            )
          )
          setFilteredJobs(matchingJobs)
        }
      } else {
        setError('No student profile found with this phone number. Please complete the assessment first.')
      }
    } catch (err) {
      console.error('Error finding student:', err)
      setError('Failed to find your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewJobDetails = (job: Job) => {
    setSelectedJob(job)
    setShowJobDetails(true)
    if (currentStudent) {
      calculateFitmentScore(job)
    } else {
      setFitmentScore(0)
    }
  }

  const calculateFitmentScore = async (job: Job) => {
    if (!currentStudent || !job) return

    try {
      setCalculatingFitment(true)
      
      // Get career recommendations for this student
      const recommendationsData = await dbOperations.getCareerRecommendations(currentStudent.id)
      console.log('Career Recommendations Data:', recommendationsData)
      setRecommendations(recommendationsData)
      
      if (recommendationsData.length === 0) {
        console.log('No career recommendations found for student')
        setFitmentScore(0)
        return
      }

      // Find the best matching recommendation
      let bestMatch = 0
      console.log('Looking for matches for job title:', job.job_title)
      
      recommendationsData.forEach(rec => {
        const roleMatch = job.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                         rec.role.toLowerCase().includes(job.job_title.toLowerCase())
        
        console.log(`Comparing "${rec.role}" with "${job.job_title}": ${roleMatch ? 'MATCH' : 'NO MATCH'}, Score: ${rec.match_score}`)
        
        if (roleMatch) {
          bestMatch = Math.max(bestMatch, rec.match_score || 0)
        }
      })

      console.log('Best direct match score:', bestMatch)

      // If no direct role match, calculate based on skills overlap
      if (bestMatch === 0 && job.key_skills && job.key_skills.length > 0) {
        console.log('No direct match found, calculating based on skills overlap')
        
        const studentSkills = recommendationsData.flatMap(rec => {
          if (!rec.explanation) return []
          
          const skillKeywords = ['analytical', 'programming', 'communication', 'leadership', 'creative', 
                                'technical', 'management', 'data', 'design', 'marketing', 'sales',
                                'problem-solving', 'teamwork', 'organization', 'research']
          
          return skillKeywords.filter(skill => 
            rec.explanation.toLowerCase().includes(skill)
          )
        }).filter(skill => skill.length > 2)
        
        console.log('Extracted student skills:', studentSkills)
        console.log('Job required skills:', job.key_skills)
        
        const jobSkills = job.key_skills.map(skill => skill.toLowerCase())
        const matchingSkills = jobSkills.filter(jobSkill => 
          studentSkills.some(studentSkill => 
            studentSkill.includes(jobSkill) || jobSkill.includes(studentSkill)
          )
        )
        
        console.log('Matching skills:', matchingSkills)
        
        const avgRecommendationScore = recommendationsData.reduce((sum, rec) => sum + (rec.match_score || 0), 0) / recommendationsData.length
        const skillOverlapRatio = matchingSkills.length / jobSkills.length
        
        console.log('Average recommendation score:', avgRecommendationScore)
        console.log('Skill overlap ratio:', skillOverlapRatio)
        
        bestMatch = Math.round(Math.min(85, (avgRecommendationScore * 0.7) + (skillOverlapRatio * 30)))
        console.log('Calculated skill-based match score:', bestMatch)
      }

      // Ensure minimum score for any job
      if (bestMatch === 0 && recommendationsData.length > 0) {
        console.log('Applying minimum score fallback')
        const avgScore = recommendationsData.reduce((sum, rec) => sum + (rec.match_score || 0), 0) / recommendationsData.length
        bestMatch = Math.max(15, Math.round(avgScore * 0.3))
        console.log('Minimum fallback score:', bestMatch)
      }

      console.log('Final fitment score:', bestMatch)
      setFitmentScore(Math.round(bestMatch))
    } catch (error) {
      console.error('Error calculating fitment score:', error)
      setFitmentScore(0)
    } finally {
      setCalculatingFitment(false)
    }
  }

  const getFitmentColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Career Opportunities</h1>
          <p className="text-gray-600">Discover jobs that match your profile</p>
        </div>

        {/* Profile Section */}
        {!sessionLoaded && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your profile...</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {sessionLoaded && !currentStudent && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle>Complete Your Career Assessment</CardTitle>
                  <CardDescription>
                    Get personalized career recommendations based on your skills and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium mb-2">Why take the assessment?</p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Get personalized job recommendations</li>
                  <li>• Discover career paths that match your skills</li>
                  <li>• See your fitment score for each opportunity</li>
                  <li>• Save and track interesting positions</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => router.push('/student/assessment')}
                  className="flex-1"
                >
                  Start Assessment
                </Button>
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-600 mb-2">Already completed assessment?</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handlePhoneSubmit}
                      disabled={phoneNumber.length !== 10 || loading}
                      variant="outline"
                    >
                      Find Profile
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStudent && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Welcome back, {currentStudent.name}!
                  </h3>
                  <p className="text-green-600">
                    Showing personalized job recommendations based on your assessment
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Profile Found
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career Recommendations Section */}
        {currentStudent && recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Career Recommendations</CardTitle>
              <CardDescription>
                Based on your assessment, here are career paths that match your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 6).map((rec, index) => (
                  <Card 
                    key={index} 
                    className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300 hover:scale-[1.02] ${
                      currentCareerFilter === rec.role ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      // Filter jobs by this career type
                      const careerJobs = jobs.filter(job => 
                        job.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                        rec.role.toLowerCase().includes(job.job_title.toLowerCase()) ||
                        job.key_skills.some(skill => 
                          skill.toLowerCase().includes(rec.role.toLowerCase()) ||
                          rec.role.toLowerCase().includes(skill.toLowerCase())
                        )
                      )
                      setFilteredJobs(careerJobs)
                      setCurrentCareerFilter(rec.role)
                      
                      // Scroll to jobs section
                      const jobsSection = document.querySelector('[data-jobs-section]')
                      if (jobsSection) {
                        jobsSection.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg text-blue-800 line-clamp-2 flex-1 mr-2">
                          {rec.role}
                        </CardTitle>
                        <Badge 
                          variant="default" 
                          className={`${
                            (rec.match_score || 0) >= 80 ? 'bg-green-600' :
                            (rec.match_score || 0) >= 60 ? 'bg-yellow-600' :
                            (rec.match_score || 0) >= 40 ? 'bg-orange-600' :
                            'bg-red-600'
                          } text-white font-bold text-sm px-2 py-1 whitespace-nowrap`}
                        >
                          {rec.match_score || 0}% Match
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Why You Match explanation */}
                        {rec.explanation && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 mb-1">Why You Match:</p>
                            <p className="text-sm text-blue-600 line-clamp-3">
                              {rec.explanation}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 font-medium">
                              {rec.openings || 0} Opening{(rec.openings || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="default"
                            className="text-xs bg-blue-600 hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Same filtering logic as card click
                              const careerJobs = jobs.filter(job => 
                                job.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                                rec.role.toLowerCase().includes(job.job_title.toLowerCase()) ||
                                job.key_skills.some(skill => 
                                  skill.toLowerCase().includes(rec.role.toLowerCase()) ||
                                  rec.role.toLowerCase().includes(skill.toLowerCase())
                                )
                              )
                              setFilteredJobs(careerJobs)
                              setCurrentCareerFilter(rec.role)
                              
                              // Scroll to jobs section
                              const jobsSection = document.querySelector('[data-jobs-section]')
                              if (jobsSection) {
                                jobsSection.scrollIntoView({ behavior: 'smooth' })
                              }
                            }}
                          >
                            View Jobs
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {recommendations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Complete your assessment to see personalized career recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Interested Jobs Section */}
        {currentStudent && interestedJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                Your Interested Jobs ({interestedJobs.length})
              </CardTitle>
              <CardDescription>
                Jobs you&apos;ve marked as interested - easily access them anytime
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const interestedJobsList = jobs.filter(job => interestedJobs.includes(job.id))
                    setFilteredJobs(interestedJobsList)
                    
                    // Scroll to jobs section
                    const jobsSection = document.querySelector('[data-jobs-section]')
                    if (jobsSection) {
                      jobsSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  View All Interested Jobs
                </Button>
                <Badge variant="secondary" className="bg-red-50 text-red-700">
                  {interestedJobs.length} jobs saved
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card data-jobs-section>
          <CardHeader>
            <CardTitle>Browse All Jobs</CardTitle>
            <CardDescription>Search through available opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search by job title, company, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search Jobs
              </Button>
            </div>

            {(careerTypeFilter || currentCareerFilter) && (
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Filtering by: {careerTypeFilter || currentCareerFilter}
                </Badge>
                {currentCareerFilter && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={clearCareerFilter}
                    className="h-6 px-2 text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="text-center py-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading job opportunities...</p>
              </div>
            )}

            {/* Jobs Grid */}
            {!loading && filteredJobs.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-blue-800 line-clamp-2">
                            {job.job_title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-2">
                            <Building2 className="h-4 w-4" />
                            {job.company_name}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {job.job_type}
                        </div>

                        <p className="text-sm text-gray-700 line-clamp-3">
                          {job.job_description}
                        </p>

                        {job.key_skills && job.key_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {job.key_skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {job.key_skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.key_skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewJobDetails(job)}
                          >
                            View Details & Fitment
                          </Button>
                          {currentStudent && (
                            <Button 
                              size="sm" 
                              variant={interestedJobs.includes(job.id) ? "default" : "outline"}
                              className={`flex items-center gap-1 ${
                                interestedJobs.includes(job.id) 
                                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                                  : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleInterestToggle(job.id)
                              }}
                            >
                              <Heart 
                                className={`h-3 w-3 ${
                                  interestedJobs.includes(job.id) 
                                    ? 'fill-white text-white' 
                                    : 'text-gray-500'
                                }`} 
                              />
                              <span className="text-xs">
                                {interestedJobs.includes(job.id) ? 'Interested' : 'Interest'}
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* No Jobs Found */}
            {!loading && filteredJobs.length === 0 && jobs.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No jobs found matching your search criteria.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              </div>
            )}

            {/* No Jobs Available */}
            {!loading && jobs.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Jobs Available
                </h3>
                <p className="text-gray-600 mb-4">
                  No job opportunities are currently available.
                </p>
                <p className="text-sm text-gray-500">
                  Please check back later for new opportunities.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment CTA - only show if no student profile */}
        {sessionLoaded && !currentStudent && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="text-center py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Your Career Assessment
              </h3>
              <p className="text-gray-600 mb-4">
                Get personalized career recommendations based on your skills and preferences
              </p>
              <Button 
                size="lg"
                onClick={() => router.push('/student/assessment')}
              >
                Take Assessment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowJobDetails(false)
              }
            }}
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Job Details & Fitment Analysis</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowJobDetails(false)}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Fitment Score Card */}
                {currentStudent && (
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {fitmentScore >= 80 ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                         fitmentScore >= 60 ? <Star className="h-5 w-5 text-yellow-600" /> :
                         fitmentScore >= 40 ? <AlertCircle className="h-5 w-5 text-orange-600" /> :
                         <XCircle className="h-5 w-5 text-red-600" />}
                        Your Fitment Score: {calculatingFitment ? 'Calculating...' : `${fitmentScore}%`}
                      </CardTitle>
                      <CardDescription>
                        Based on your career assessment and this job&apos;s requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Progress value={calculatingFitment ? 0 : fitmentScore} className="h-3" />
                        {!calculatingFitment && (
                          <>
                            <div className={`text-sm font-medium ${getFitmentColor(fitmentScore)}`}>
                              {getFitmentMessage(fitmentScore)}
                            </div>
                            <div className="text-sm text-gray-600 bg-white p-3 rounded-lg">
                              <strong>Recommendation:</strong> {getRecommendation(fitmentScore)}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Job Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-600">{selectedJob.company_name}</span>
                    </div>
                    <CardTitle className="text-2xl text-blue-800">{selectedJob.job_title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-base">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedJob.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedJob.job_type}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3 text-lg">Job Description</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedJob.job_description}
                      </p>
                    </div>

                    {selectedJob.key_skills && selectedJob.key_skills.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-lg">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.key_skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <p className="text-xs text-gray-500">
                        Job posted: {new Date(selectedJob.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Career Match */}
                {currentStudent && recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Career Match</CardTitle>
                      <CardDescription>
                        Based on your assessment results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {recommendations.slice(0, 3).map((rec, index) => {
                          const isMatch = selectedJob.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                                         rec.role.toLowerCase().includes(selectedJob.job_title.toLowerCase())
                          
                          if (!isMatch) return null // Only show matching roles
                          
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{rec.role}</span>
                              </div>
                              <Badge className="bg-green-600">
                                {rec.match_score || 0}% Match
                              </Badge>
                            </div>
                          )
                        })}
                        
                        {!recommendations.some(rec => 
                          selectedJob.job_title.toLowerCase().includes(rec.role.toLowerCase()) ||
                          rec.role.toLowerCase().includes(selectedJob.job_title.toLowerCase())
                        ) && (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <AlertCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">This role doesn&apos;t match your top career recommendations</span>
                          </div>
                        )}
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
                        Enter your phone number above to see how well this job matches your career profile.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Company Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedJob.company_name}</h3>
                        <p className="text-sm text-gray-600">{selectedJob.location}</p>
                      </div>
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

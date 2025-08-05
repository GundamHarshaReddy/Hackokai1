"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Briefcase, TrendingUp, Phone, Mail, GraduationCap, QrCode, Trash2, Printer, Eye, Loader2, Building2, MapPin, Calendar, X } from "lucide-react"
import { dbOperations } from '@/lib/supabase'
import { QRCodeComponent } from '@/components/QRCodeComponent'

interface Student {
  id: string
  name: string
  email: string
  phone: string
  education_degree: string
  specialization: string
  core_values: string[]
  created_at: string
}

interface Job {
  id: string
  company_name: string
  job_title: string
  job_description: string
  job_type: string
  location: string
  key_skills: string[]
  created_at: string
}

interface StudentSummary {
  student: Student
  summary: string
  stats: {
    recommendations_count: number
    job_interests_count: number
    profile_completion: number
  }
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null)
  const [showQRModal, setShowQRModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalStudents: 0,
    totalInterests: 0,
    internships: 0,
    fullTime: 0,
    freelance: 0,
  })

  // Load initial data
  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [searchTerm, jobs])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [studentsData, jobsData] = await Promise.all([
        dbOperations.getAllStudents(),
        dbOperations.getJobs()
      ])

      setJobs(jobsData || [])

      // Calculate stats
      const jobTypeStats = jobsData.reduce((acc: Record<string, number>, job: Job) => {
        const type = job.job_type.toLowerCase()
        if (type.includes('internship')) acc.internships++
        else if (type.includes('full')) acc.fullTime++
        else if (type.includes('freelance') || type.includes('contract')) acc.freelance++
        return acc
      }, { internships: 0, fullTime: 0, freelance: 0 })

      setStats({
        totalJobs: jobsData.length,
        totalStudents: studentsData.length,
        totalInterests: 0, // TODO: Add interest count
        ...jobTypeStats
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs)
      return
    }

    const filtered = jobs.filter(job => 
      job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_type.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredJobs(filtered)
  }

  const handlePhoneSearch = async () => {
    if (!phoneSearch.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await dbOperations.searchStudentsByPhone(phoneSearch)
      setSearchResults(results || [])
    } catch (error) {
      console.error('Error searching students:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const generateStudentSummary = async (studentId: string) => {
    setSummaryLoading(true)
    try {
      const response = await fetch('/api/student-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const summaryData = await response.json()
      setSelectedStudent(summaryData)
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Failed to generate student summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      await dbOperations.deleteJob(jobId)
      await loadDashboardData() // Refresh the job list
      alert('Job deleted successfully')
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
    }
  }

  const printQR = (jobId: string) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Job ${jobId}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                font-family: Arial, sans-serif;
              }
              .qr-container { 
                text-align: center; 
                border: 2px solid #000; 
                padding: 20px; 
                margin: 20px;
              }
              h2 { margin-bottom: 20px; }
              .job-info { margin-top: 20px; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>Scan for Job Details</h2>
              <div id="qr-code"></div>
              <div class="job-info">
                <p>Job ID: ${jobId}</p>
                <p>Scan to view job details and apply</p>
              </div>
            </div>
          </body>
        </html>
      `)
      
      // Add QR code after document is ready
      setTimeout(() => {
        const qrContainer = printWindow.document.getElementById('qr-code')
        if (qrContainer) {
          // Create QR code using a simple approach
          const baseUrl = process.env.NODE_ENV === 'development' 
            ? `http://localhost:${window.location.port || 3000}` 
            : window.location.origin
          const qrUrl = `${baseUrl}/job/${jobId}`
          
          // Using a QR code service for printing
          qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}" alt="QR Code" />`
          
          setTimeout(() => {
            printWindow.print()
            printWindow.close()
          }, 1000)
        }
      }, 500)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage jobs, students, and monitor platform activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Jobs</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Students</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Internships</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.internships}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Full-time</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.fullTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="jobs" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="jobs" className="text-xs sm:text-sm py-2">Jobs</TabsTrigger>
            <TabsTrigger value="students" className="text-xs sm:text-sm py-2">Students</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Analytics</TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Postings Management
                </CardTitle>
                <CardDescription>
                  Manage all job postings, generate QR codes, and delete roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={() => window.location.href = '/company/post-job'}
                    className="whitespace-nowrap text-sm"
                    size="sm"
                  >
                    Add New Job
                  </Button>
                </div>

                {/* Jobs List */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No jobs found. {searchTerm && "Try adjusting your search terms."}
                    </div>
                  ) : (
                    filteredJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{job.job_title}</h3>
                                <Badge variant="secondary" className="self-start sm:self-auto">{job.job_type}</Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4" />
                                  <span className="truncate">{job.company_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <p className="text-gray-700 line-clamp-2 mb-3 text-sm sm:text-base">
                                {job.job_description}
                              </p>
                              {job.key_skills && job.key_skills.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {job.key_skills.slice(0, 3).map((skill: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
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
                            </div>
                            <div className="flex flex-row sm:flex-col gap-2 justify-center sm:ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowQRModal(job.id)}
                                className="flex items-center gap-1 flex-1 sm:flex-none"
                              >
                                <QrCode className="h-4 w-4" />
                                <span className="hidden sm:inline">QR Code</span>
                                <span className="sm:hidden">QR</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printQR(job.id)}
                                className="flex items-center gap-1 flex-1 sm:flex-none"
                              >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">Print QR</span>
                                <span className="sm:hidden">Print</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteJob(job.id)}
                                className="flex items-center gap-1 flex-1 sm:flex-none"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                                <span className="sm:hidden">Del</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Student Search & Summary
                </CardTitle>
                <CardDescription>
                  Search students by phone number and generate AI-powered summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="Enter phone number..."
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full"
                    />
                  </div>
                  <Button
                    onClick={handlePhoneSearch}
                    disabled={loading || phoneSearch.length === 0}
                    className="flex items-center gap-2 text-sm"
                    size="sm"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Search
                  </Button>
                </div>

                {/* Search Results */}
                <div className="space-y-4">
                  {searchResults.length === 0 && phoneSearch.length > 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      No students found with phone number: {phoneSearch}
                    </div>
                  )}
                  
                  {searchResults.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{student.name}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{student.email}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{student.phone}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{student.education_degree}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span>Joined {new Date(student.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="mb-3">
                              <p className="text-sm text-gray-600 mb-1">Specialization:</p>
                              <p className="text-gray-900 text-sm">{student.specialization || 'Not specified'}</p>
                            </div>
                            {student.core_values && student.core_values.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {student.core_values.slice(0, 3).map((value: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {value}
                                  </Badge>
                                ))}
                                {student.core_values.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{student.core_values.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="sm:ml-4">
                            <Button
                              onClick={() => generateStudentSummary(student.id)}
                              disabled={summaryLoading}
                              className="flex items-center gap-2 w-full sm:w-auto text-sm"
                              size="sm"
                            >
                              {summaryLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">Generate Summary</span>
                              <span className="sm:hidden">Summary</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Overview of platform performance and usage statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalJobs}</div>
                    <div className="text-sm text-blue-800">Total Job Postings</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
                    <div className="text-sm text-green-800">Registered Students</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.internships}</div>
                    <div className="text-sm text-purple-800">Internship Opportunities</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{stats.fullTime}</div>
                    <div className="text-sm text-orange-800">Full-time Positions</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.freelance}</div>
                    <div className="text-sm text-indigo-800">Freelance/Contract</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.totalJobs > 0 ? Math.round((stats.totalStudents / stats.totalJobs) * 100) / 100 : 0}
                    </div>
                    <div className="text-sm text-gray-800">Students per Job</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QR Code Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>QR Code for Job</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQRModal(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="text-center">
                <QRCodeComponent jobId={showQRModal} size={200} />
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    Students can scan this QR code to view job details and apply
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => printQR(showQRModal)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print QR Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Student Summary Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Student Summary - {selectedStudent.student.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Student Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Student Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Email:</span> {selectedStudent.student.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedStudent.student.phone}</p>
                    <p><span className="font-medium">Education:</span> {selectedStudent.student.education_degree}</p>
                    <p><span className="font-medium">Specialization:</span> {selectedStudent.student.specialization}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{selectedStudent.stats.profile_completion}%</div>
                    <div className="text-xs text-blue-800">Profile Complete</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{selectedStudent.stats.recommendations_count}</div>
                    <div className="text-xs text-green-800">Career Matches</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{selectedStudent.stats.job_interests_count}</div>
                    <div className="text-xs text-purple-800">Job Interests</div>
                  </div>
                </div>

                {/* AI Summary */}
                <div>
                  <h4 className="font-semibold mb-2">AI-Generated Summary</h4>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedStudent.summary}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

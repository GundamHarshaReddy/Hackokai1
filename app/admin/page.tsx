"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Trash2, QrCode, Users, Briefcase, TrendingUp } from "lucide-react"
import { type Job, type Student, dbHelpers } from "@/lib/supabase"
import { generateStudentSummary } from "@/lib/groq"

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [phoneSearch, setPhoneSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentSummary, setStudentSummary] = useState("")
  const [loading, setLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalStudents: 0,
    totalInterests: 0,
    internships: 0,
    fullTime: 0,
    freelance: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [jobs, students, stats] = await Promise.all([
        dbHelpers.getJobs(),
        dbHelpers.getStudents(),
        dbHelpers.getJobStats(),
      ])

      setJobs(jobs)
      setStudents(students)
      setStats(stats)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return

    try {
      await dbHelpers.deleteJob(jobId)
      setJobs(jobs.filter((job) => job.id !== jobId))
    } catch (error) {
      console.error("Error deleting job:", error)
      alert("Error deleting job")
    }
  }

  const printQRCode = (job: Job) => {
    if (job.qr_code_url) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${job.job_title}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 20px; 
                }
                .qr-container { 
                  border: 2px solid #000; 
                  padding: 20px; 
                  display: inline-block; 
                  margin: 20px;
                }
                h1 { font-size: 24px; margin-bottom: 10px; }
                h2 { font-size: 18px; margin-bottom: 20px; }
                img { max-width: 300px; }
                .job-id { font-size: 16px; font-weight: bold; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <h1>${job.job_title}</h1>
                <h2>${job.company_name}</h2>
                <img src="${job.qr_code_url}" alt="QR Code" />
                <div class="job-id">Job ID: ${job.job_id}</div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const searchStudent = async () => {
    if (!phoneSearch.trim()) return

    try {
      const student = await dbHelpers.getStudentByPhone(phoneSearch.trim())
      if (!student) {
        alert("Student not found")
        return
      }
      setSelectedStudent(student)
      generateSummary(student)
    } catch (error) {
      console.error("Error searching student:", error)
      alert("Error searching student")
    }
  }

  const generateSummary = async (student: Student) => {
    setSummaryLoading(true)
    try {
      const summary = await generateStudentSummary(student)
      setStudentSummary(summary)
    } catch (error) {
      console.error("Error generating summary:", error)
      setStudentSummary("Error generating summary")
    } finally {
      setSummaryLoading(false)
    }
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const statsDisplay = {
    totalJobs: stats.totalJobs,
    totalStudents: stats.totalStudents,
    internships: stats.internships,
    fullTime: stats.fullTime,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage jobs, students, and platform analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsDisplay.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsDisplay.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Internships</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsDisplay.internships}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Full-Time Jobs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsDisplay.fullTime}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="jobs">Job Management</TabsTrigger>
            <TabsTrigger value="students">Student Search</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Postings</CardTitle>
                <CardDescription>Manage all job postings on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search jobs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold">{job.job_title}</h3>
                              <Badge variant={job.job_type === "Internship" ? "secondary" : "default"}>
                                {job.job_type}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-2">{job.company_name}</p>
                            <p className="text-sm text-gray-500 mb-2">Job ID: {job.job_id}</p>
                            <p className="text-sm text-gray-500">
                              Posted: {new Date(job.created_at).toLocaleDateString()}
                            </p>
                            {job.key_skills && job.key_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {job.key_skills.slice(0, 3).map((skill, index) => (
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

                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => printQRCode(job)}>
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteJob(job.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredJobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No jobs found matching your search.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Search</CardTitle>
                <CardDescription>
                  Search for students by phone number and view their AI-generated summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-6">
                  <Input
                    placeholder="Enter phone number..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchStudent}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {selectedStudent && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">Student Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                          <p className="text-gray-600">{selectedStudent.email}</p>
                          <p className="text-gray-600">{selectedStudent.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Education:</span> {selectedStudent.education_degree}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Specialization:</span> {selectedStudent.specialization}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Registered:</span>{" "}
                            {new Date(selectedStudent.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Core Values</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedStudent.core_values.map((value, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">AI-Generated Summary</h4>
                        {summaryLoading ? (
                          <p className="text-gray-500">Generating summary...</p>
                        ) : (
                          <div className="bg-white p-4 rounded-lg border">
                            <p className="text-gray-700 leading-relaxed">{studentSummary}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

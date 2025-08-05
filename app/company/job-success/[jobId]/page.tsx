"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Briefcase, QrCode, Copy, ExternalLink } from "lucide-react"
import { QRCodeComponent } from "@/components/QRCodeComponent"

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

export default function JobSuccessPage() {
  const params = useParams()
  const jobId = params.jobId as string
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (jobId && jobId !== 'undefined') {
      fetchJobDetails()
    } else {
      setError("Invalid job ID")
      setLoading(false)
    }
  }, [jobId])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (response.ok) {
        const jobData = await response.json()
        setJob(jobData)
      } else {
        setError("Job not found")
      }
    } catch (err) {
      console.error('Error fetching job:', err)
      setError("Failed to load job details")
    } finally {
      setLoading(false)
    }
  }

  const jobUrl = typeof window !== 'undefined' ? `${window.location.origin}/job/${jobId}` : `/job/${jobId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading job details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-red-600 mb-4">
              <p className="text-lg font-semibold">Error</p>
              <p>{error}</p>
            </div>
            <Button onClick={() => window.location.href = '/company/post-job'}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-800">Job Posted Successfully!</CardTitle>
            <CardDescription className="text-lg">
              Your job posting is now live and ready to receive applications
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Job ID</label>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">{jobId}</p>
              </div>
              
              {job && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    <p className="font-medium">{job.company_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Position</label>
                    <p className="font-medium">{job.job_title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Location</label>
                    <p>{job.location}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p>{job.job_type}</p>
                  </div>
                  
                  {job.key_skills && job.key_skills.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Key Skills</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.key_skills.map((skill, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code & Share
              </CardTitle>
              <CardDescription>
                Students can scan this QR code to view the job posting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <QRCodeComponent jobId={jobId} />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Job URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="text" 
                    value={jobUrl}
                    readOnly
                    className="flex-1 text-sm bg-gray-100 p-2 rounded border"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(jobUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Job Posting
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button 
              className="flex-1" 
              onClick={() => window.location.href = '/company/post-job'}
            >
              Post Another Job
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = '/student/opportunities'}
            >
              View All Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

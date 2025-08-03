"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, Plus, Copy, QrCode, Edit, Trash2 } from "lucide-react"
import { type Job, dbHelpers } from "@/lib/supabase"
import { downloadQRCode } from "@/lib/qr-generator"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function JobSuccessPage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [resolvedParams.jobId])

  // Replace the fetchJob function
  const fetchJob = async () => {
    try {
      const job = await dbHelpers.getJobByJobId(resolvedParams.jobId)
      setJob(job)
    } catch (error) {
      console.error("Error fetching job:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleDownloadQR = async () => {
    if (!job?.qr_code_url) return

    setDownloading(true)
    try {
      await downloadQRCode(job.qr_code_url, `${job.job_id}-qr-code.png`)
    } catch (error) {
      console.error("Error downloading QR code:", error)
      alert("Error downloading QR code. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  // Replace the deleteJob function
  const deleteJob = async () => {
    if (!job || !confirm("Are you sure you want to delete this job posting?")) return

    try {
      await dbHelpers.deleteJob(job.id)
      alert("Job deleted successfully!")
      router.push("/admin")
    } catch (error) {
      console.error("Error deleting job:", error)
      alert("Error deleting job. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">Job not found</div>
        </div>
      </div>
    )
  }

  const jobUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/job/${job.job_id}`

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Job Preview - Verify Before Publishing
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Job
                  </Button>
                  <Button variant="destructive" onClick={deleteJob}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Review all details carefully before making this job live</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{job.job_title}</h3>
                  <p className="text-gray-600 mb-2">{job.company_name}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{job.job_type}</span>
                  </div>
                  {job.location && <p className="text-sm text-gray-500 mt-2">📍 {job.location}</p>}
                  {job.salary_stipend && <p className="text-sm text-gray-500">💰 {job.salary_stipend}</p>}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <p className="text-sm text-gray-600">{job.contact_name}</p>
                  <p className="text-sm text-gray-600">{job.contact_number}</p>
                  <p className="text-sm text-gray-500 mt-2">Job ID: {job.job_id}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Job Description</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.job_description}</p>
                </div>
              </div>

              {job.key_skills && job.key_skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Skills Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {job.key_skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4 border-t">
                <Button onClick={() => setShowPreview(false)} className="flex-1">
                  Confirm & Publish
                </Button>
                <Button variant="outline" onClick={() => router.push("/company/post-job")}>
                  Create New Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="text-center mb-8">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Job Posted Successfully!</CardTitle>
            <CardDescription>Your job opportunity is now live and ready for candidates</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                QR Code for Opportunity Wall
              </CardTitle>
              <CardDescription>
                Print this QR code and display it at your booth for instant candidate access
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {job.qr_code_url && (
                <div className="bg-white p-6 rounded-lg inline-block border-2 border-gray-200">
                                    <img
                    src={job.qr_code_url || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwSDI1MFYyNTBIMjAwVjE1MFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+"}
                    alt="QR Code"
                    className="w-64 h-64 border rounded-lg"
                  />
                  <div className="mt-4 text-center">
                    <p className="font-semibold text-gray-900">{job.job_title}</p>
                    <p className="text-sm text-gray-600">{job.company_name}</p>
                    <p className="text-xs text-gray-500 mt-1">Job ID: {job.job_id}</p>
                  </div>
                </div>
              )}
              <Button onClick={handleDownloadQR} disabled={downloading} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Downloading..." : "Download QR Code"}
              </Button>
            </CardContent>
          </Card>

          {/* Job Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
              <CardDescription>Your published job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{job.job_title}</h3>
                <p className="text-gray-600">{job.company_name}</p>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm mt-1">
                  {job.job_type}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Job ID:</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{job.job_id}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(job.job_id)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Direct Job URL:</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 truncate">{jobUrl}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(jobUrl)}>
                    {copied ? "Copied!" : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Contact Information:</p>
                <p className="text-sm text-gray-600">{job.contact_name}</p>
                <p className="text-sm text-gray-600">{job.contact_number}</p>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => setShowPreview(true)} variant="outline" className="w-full mb-2">
                  <Edit className="mr-2 h-4 w-4" />
                  Preview & Edit Job
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Link href="/company/post-job">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Post Another Job
            </Button>
          </Link>
          <Link href="/admin">
            <Button>View All Jobs</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

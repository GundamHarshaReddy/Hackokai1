"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Eye, Plus, X, Volume2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PostJobPage() {
  const router = useRouter()
  const [isRecording, setIsRecording] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [keySkillInput, setKeySkillInput] = useState("")
  const [voiceTranscript, setVoiceTranscript] = useState("")

  const [jobData, setJobData] = useState({
    contact_name: "",
    contact_number: "",
    company_name: "",
    job_title: "",
    job_type: "",
    job_description: "",
    location: "",
    salary_stipend: "",
    key_skills: [] as string[],
  })

  // Enhanced voice input with field-specific recognition
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

    if (isRecording) {
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true  // Allow longer speech
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsRecording(true)
    setVoiceTranscript("")

    recognition.onstart = () => {
      console.log("Voice recognition started")
      alert("🎤 Listening... Please speak all job details clearly. Example: 'My name is John Doe, phone number 9876543210, company TechCorp, job title Software Developer, full-time position, location Bangalore, salary 50000 per month, skills required are JavaScript React Node.js, job description is we need a developer to build web applications'")
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log("Voice input received:", transcript)
      setVoiceTranscript(transcript)
      parseVoiceInputEnhanced(transcript)
      setIsRecording(false)
    }

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setIsRecording(false)
      if (event.error === "no-speech") {
        alert("No speech detected. Please try again and speak clearly.")
      } else if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone access and try again.")
      } else {
        alert("Voice recognition error. Please try again or fill the form manually.")
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    try {
      recognition.start()
    } catch (error) {
      console.error("Failed to start recognition:", error)
      setIsRecording(false)
      alert("Failed to start voice recognition. Please try again.")
    }
  }

  // Enhanced voice parsing with AI-powered field extraction
  const parseVoiceInputEnhanced = async (transcript: string) => {
    console.log("Parsing enhanced transcript:", transcript)
    
    try {
      // Use AI to parse the voice input into structured job data
      const response = await fetch('/api/parse-voice-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      if (response.ok) {
        const parsedData = await response.json()
        console.log("AI parsed data:", parsedData)
        
        // Update job data with AI-parsed results
        setJobData(prev => ({
          ...prev,
          contact_name: parsedData.contact_name || prev.contact_name,
          contact_number: parsedData.contact_number || prev.contact_number,
          company_name: parsedData.company_name || prev.company_name,
          job_title: parsedData.job_title || prev.job_title,
          job_type: parsedData.job_type || prev.job_type,
          location: parsedData.location || prev.location,
          salary_stipend: parsedData.salary_stipend || prev.salary_stipend,
          key_skills: parsedData.key_skills?.length > 0 ? parsedData.key_skills : prev.key_skills,
          job_description: parsedData.job_description || prev.job_description,
        }))
        
        alert("✅ Voice input processed successfully! Please review and edit any fields as needed.")
      } else {
        // Fallback to manual parsing
        parseVoiceInputFallback(transcript)
      }
    } catch (error) {
      console.error("AI parsing failed, using fallback:", error)
      parseVoiceInputFallback(transcript)
    }
  }

  // Fallback parsing with improved patterns
  const parseVoiceInputFallback = (transcript: string) => {
    const text = transcript.toLowerCase()
    const updatedJobData = { ...jobData }

    console.log("Using fallback parsing for:", transcript)

    // Name extraction (simpler patterns)
    if (!updatedJobData.contact_name) {
      const namePatterns = [
        /(?:my name is|i am|this is|i'm|call me)\s+([a-z\s]{2,30})/i,
        /(?:contact person|person is|contact is)\s+([a-z\s]{2,30})/i,
      ]

      for (const pattern of namePatterns) {
        const match = transcript.match(pattern)
        if (match && match[1]) {
          const name = match[1].trim().replace(/\b(and|from|at|phone|number|company)\b.*/i, '')
          if (name.length > 1 && name.split(' ').length <= 4) {
            updatedJobData.contact_name = name
            break
          }
        }
      }
    }

    // Phone number extraction (improved)
    if (!updatedJobData.contact_number) {
      const phonePatterns = [
        /(?:phone|number|mobile|contact).*?([+]?[0-9\s\-()]{8,15})/i,
        /\b([0-9]{10})\b/,
        /\b([+][0-9\s\-()]{8,15})\b/,
      ]

      for (const pattern of phonePatterns) {
        const match = transcript.match(pattern)
        if (match && match[1]) {
          const phone = match[1].replace(/[^\d+\-\s()]/g, '').trim()
          if (phone.length >= 8) {
            updatedJobData.contact_number = phone
            break
          }
        }
      }
    }

    // Company extraction (simpler)
    if (!updatedJobData.company_name) {
      const companyPatterns = [
        /(?:company|from|work at|represent)\s+([a-z\s&.]{2,30})/i,
        /(?:we are|i'm with)\s+([a-z\s&.]{2,30})/i,
      ]

      for (const pattern of companyPatterns) {
        const match = transcript.match(pattern)
        if (match && match[1]) {
          const company = match[1].trim().replace(/\b(and|hiring|looking|need)\b.*/i, '')
          if (company.length > 1) {
            updatedJobData.company_name = company
            break
          }
        }
      }
    }

    // Job title extraction
    if (!updatedJobData.job_title) {
      const titlePatterns = [
        /(?:job title|position|role|hiring for|looking for)\s+(?:is\s+)?([a-z\s]{3,30})/i,
        /(?:need|want|seeking)\s+(?:a|an)?\s*([a-z\s]{3,30})\s+(?:position|role|developer|engineer|manager|analyst)/i,
      ]

      for (const pattern of titlePatterns) {
        const match = transcript.match(pattern)
        if (match && match[1]) {
          const title = match[1].trim().replace(/\b(position|role|job|person)\b/gi, '').trim()
          if (title.length > 2) {
            updatedJobData.job_title = title
            break
          }
        }
      }
    }

    // Job type extraction
    if (!updatedJobData.job_type) {
      if (text.includes('intern') || text.includes('internship')) {
        updatedJobData.job_type = 'Internship'
      } else if (text.includes('full time') || text.includes('permanent')) {
        updatedJobData.job_type = 'Full-Time'
      } else if (text.includes('freelance') || text.includes('contract') || text.includes('part time')) {
        updatedJobData.job_type = 'Freelance'
      }
    }

    // Location extraction
    if (!updatedJobData.location) {
      const locationPatterns = [
        /(?:location|based in|located in|office in|work from)\s+([a-z\s,]{2,30})/i,
        /(?:in|at)\s+(bangalore|mumbai|delhi|chennai|hyderabad|pune|kolkata|ahmedabad)/i,
      ]

      for (const pattern of locationPatterns) {
        const match = transcript.match(pattern)
        if (match && match[1]) {
          updatedJobData.location = match[1].trim()
          break
        }
      }
    }

    // Salary extraction
    if (!updatedJobData.salary_stipend) {
      const salaryPatterns = [
        /(?:salary|stipend|pay|package).*?([0-9,]+\s*(?:per month|monthly|thousand|lakh|k|rupees|rs))/i,
        /([0-9,]+\s*(?:per month|monthly|thousand|lakh|k|rupees|rs))/i,
      ]

      for (const pattern of salaryPatterns) {
        const match = transcript.match(pattern)
        if (match && match[1]) {
          updatedJobData.salary_stipend = match[1].trim()
          break
        }
      }
    }

    // Skills extraction
    const skillsPattern = /(?:skills|technologies|tech stack|experience in|know|familiar with|use)\s+(?:are|required|like)?\s*([a-z\s,&.+#-]+?)(?:\s(?:and|experience|knowledge|job description|description))/i
    const skillsMatch = transcript.match(skillsPattern)
    if (skillsMatch && skillsMatch[1]) {
      const skills = skillsMatch[1]
        .split(/,|\s+and\s+|\s+or\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && !['the', 'and', 'or', 'with'].includes(s.toLowerCase()))
        .slice(0, 8)
      
      if (skills.length > 0) {
        updatedJobData.key_skills = [...new Set([...updatedJobData.key_skills, ...skills])]
      }
    }

    // Job description extraction (everything after "job description" or "description")
    const descriptionPattern = /(?:job description|description)\s+(?:is\s+)?(.+?)(?:\s*$)/i
    const descriptionMatch = transcript.match(descriptionPattern)
    if (descriptionMatch && descriptionMatch[1] && !updatedJobData.job_description) {
      updatedJobData.job_description = descriptionMatch[1].trim()
    } else if (!updatedJobData.job_description) {
      // If no specific description found, use a clean version of the transcript
      updatedJobData.job_description = transcript.replace(/my name is.*?(?=job description|description|$)/i, '').trim()
    }

    console.log("Fallback parsed data:", updatedJobData)
    setJobData(updatedJobData)
    alert("📝 Voice input processed! Some fields may need manual review. Please check all details before submitting.")
  }

  const addKeySkill = () => {
    if (keySkillInput.trim() && !jobData.key_skills.includes(keySkillInput.trim())) {
      setJobData((prev) => ({
        ...prev,
        key_skills: [...prev.key_skills, keySkillInput.trim()],
      }))
      setKeySkillInput("")
    }
  }

  const removeKeySkill = (skill: string) => {
    setJobData((prev) => ({
      ...prev,
      key_skills: prev.key_skills.filter((s) => s !== skill),
    }))
  }

  const clearForm = () => {
    setJobData({
      contact_name: "",
      contact_number: "",
      company_name: "",
      job_title: "",
      job_type: "",
      job_description: "",
      location: "",
      salary_stipend: "",
      key_skills: [],
    })
    setVoiceTranscript("")
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/post-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to post job')
      }

      // Navigate to success page with the job ID
      router.push(`/company/job-success/${result.job.job_id}`)
    } catch (error) {
      console.error("Error posting job:", error)
      alert("Error posting job. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = () => {
    return (
      jobData.contact_name &&
      jobData.contact_number &&
      jobData.company_name &&
      jobData.job_title &&
      jobData.job_type &&
      jobData.job_description
    )
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Job Preview
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardTitle>
              <CardDescription>Review your job posting before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{jobData.job_title}</h3>
                  <p className="text-gray-600 mb-2">{jobData.company_name}</p>
                  <Badge>{jobData.job_type}</Badge>
                  {jobData.location && <p className="text-sm text-gray-500 mt-2">📍 {jobData.location}</p>}
                  {jobData.salary_stipend && <p className="text-sm text-gray-500">💰 {jobData.salary_stipend}</p>}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <p className="text-sm text-gray-600">{jobData.contact_name}</p>
                  <p className="text-sm text-gray-600">{jobData.contact_number}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Job Description</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{jobData.job_description}</p>
              </div>

              {jobData.key_skills.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {jobData.key_skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? "Publishing..." : "Publish Job"}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Edit Job
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
        <Card>
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>
              Fill in the details manually or use voice input to automatically populate all fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voice Input Section */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  <Volume2 className="mr-2 h-5 w-5" />
                  Flexible Voice Input
                </CardTitle>
                <CardDescription>
                  Speak naturally in any format! Our system understands different ways of expressing the same
                  information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={handleVoiceInput}
                    className={`flex-1 ${
                      isRecording ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Listening... Click to Stop
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Start Voice Input
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={clearForm}>
                    Clear Form
                  </Button>
                </div>

                {voiceTranscript && (
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600 mb-1">What we heard:</p>
                    <p className="text-sm italic">"{voiceTranscript}"</p>
                  </div>
                )}

                <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                  <p className="font-medium mb-2">💡 You can speak in ANY of these ways:</p>

                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-blue-600">Formal Style:</p>
                      <p className="italic">
                        "My name is John Smith, phone number is 9876543210. We are TechCorp company and we are hiring
                        for Software Engineer position."
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-green-600">Casual Style:</p>
                      <p className="italic">
                        "Hi, I'm Sarah from ABC Solutions. Call me at 9876543210. We need a web developer for full-time
                        work in Mumbai."
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-purple-600">Business Style:</p>
                      <p className="italic">
                        "Good morning, this is Mike Johnson representing XYZ Corp. You can reach me at 9876543210. We
                        have an opening for Data Analyst intern."
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-orange-600">Mixed Style:</p>
                      <p className="italic">
                        "Hello, Mike here from TechStart. Looking for React developer, full-time position in Bangalore.
                        Contact 9876543210. Need JavaScript, React skills."
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    The system recognizes: names, phone numbers, company names, job titles, locations, salaries, skills,
                    and job types in any natural speaking style!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Manual Form Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Person's Name *</Label>
                <Input
                  id="contact_name"
                  value={jobData.contact_name}
                  onChange={(e) => setJobData({ ...jobData, contact_name: e.target.value })}
                  placeholder="Contact person name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input
                  id="contact_number"
                  value={jobData.contact_number}
                  onChange={(e) => setJobData({ ...jobData, contact_number: e.target.value })}
                  placeholder="Contact phone number"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={jobData.company_name}
                  onChange={(e) => setJobData({ ...jobData, company_name: e.target.value })}
                  placeholder="Tech Corp Inc."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  value={jobData.job_title}
                  onChange={(e) => setJobData({ ...jobData, job_title: e.target.value })}
                  placeholder="Software Engineer Intern"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type *</Label>
              <Select value={jobData.job_type} onValueChange={(value) => setJobData({ ...jobData, job_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">Job Description *</Label>
              <Textarea
                id="job_description"
                value={jobData.job_description}
                onChange={(e) => setJobData({ ...jobData, job_description: e.target.value })}
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={6}
                required
              />
            </div>

            {/* Optional Fields */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Optional Information</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={jobData.location}
                    onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                    placeholder="Bangalore, India"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_stipend">Salary / Stipend</Label>
                  <Input
                    id="salary_stipend"
                    value={jobData.salary_stipend}
                    onChange={(e) => setJobData({ ...jobData, salary_stipend: e.target.value })}
                    placeholder="₹25,000/month"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_skills">Key Skills</Label>
                <div className="flex space-x-2">
                  <Input
                    id="key_skills"
                    value={keySkillInput}
                    onChange={(e) => setKeySkillInput(e.target.value)}
                    placeholder="Add a skill and press Enter"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeySkill())}
                  />
                  <Button type="button" onClick={addKeySkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {jobData.key_skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {jobData.key_skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeySkill(skill)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={() => setShowPreview(true)} disabled={!canSubmit()} variant="outline" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                Preview Job
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit() || loading} className="flex-1">
                {loading ? "Publishing..." : "Publish Job"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

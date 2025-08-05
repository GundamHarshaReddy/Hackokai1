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
  const [currentField, setCurrentField] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognitionRef, setRecognitionRef] = useState<any>(null)
  const [interimText, setInterimText] = useState("")

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

  // Enhanced voice input with field-specific recognition and real-time display
  const startFieldVoiceInput = (fieldName: string) => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.")
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

    // Stop existing recognition if any
    if (recognitionRef) {
      recognitionRef.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    setCurrentField(fieldName)
    setInterimText("")
    setRecognitionRef(recognition)

    recognition.onstart = () => {
      console.log(`Voice recognition started for ${fieldName}`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Show interim results
      setInterimText(interimTranscript)

      // Update field with final results
      if (finalTranscript) {
        updateFieldFromVoice(fieldName, finalTranscript.trim())
        setInterimText("")
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error)
      setCurrentField(null)
      setInterimText("")
      if (event.error === "no-speech") {
        // Don't show alert for no-speech, just stop
      } else if (event.error === "not-allowed") {
        alert("Microphone access denied. Please allow microphone access and try again.")
      }
    }

    recognition.onend = () => {
      setCurrentField(null)
      setInterimText("")
    }

    try {
      recognition.start()
    } catch (error) {
      console.error("Failed to start recognition:", error)
      setCurrentField(null)
      alert("Failed to start voice recognition. Please try again.")
    }
  }

  const stopVoiceInput = () => {
    if (recognitionRef) {
      recognitionRef.stop()
    }
    setCurrentField(null)
    setInterimText("")
  }

  const updateFieldFromVoice = (fieldName: string, text: string) => {
    const processedText = processVoiceTextForField(fieldName, text)
    
    setJobData(prev => ({
      ...prev,
      [fieldName]: fieldName === 'key_skills' ? 
        [...prev.key_skills, ...processedText.split(',').map(s => s.trim()).filter(s => s)] :
        processedText
    }))
  }

  const processVoiceTextForField = (fieldName: string, text: string): string => {
    switch (fieldName) {
      case 'contact_number': {
        // Extract and format phone numbers
        const phoneMatch = text.match(/[\d\s\-+()]{8,}/g)
        return phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : text
      }
      case 'salary_stipend': {
        // Format salary mentions
        return text.replace(/(\d+)\s*(thousand|k|lakh|crore)/gi, (match, num, unit) => {
          const lowerUnit = unit.toLowerCase()
          let multiplier = ''
          if (lowerUnit.startsWith('th') || lowerUnit === 'k') {
            multiplier = '000'
          } else if (lowerUnit.startsWith('l')) {
            multiplier = '00000'
          } else {
            multiplier = '0000000'
          }
          return num + multiplier
        })
      }
      case 'job_type': {
        // Normalize job types
        const jobTypeMap: { [key: string]: string } = {
          'full time': 'full-time',
          'part time': 'part-time',
          'intern': 'internship',
          'contract': 'contract'
        }
        const lowerText = text.toLowerCase()
        for (const [key, value] of Object.entries(jobTypeMap)) {
          if (lowerText.includes(key)) return value
        }
        return text
      }
      default:
        return text
    }
  }

  // Enhanced voice parsing with AI-powered field extraction
  // Legacy voice input function for full form filling
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.")
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

    if (isRecording) {
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = true
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsRecording(true)
    setVoiceTranscript("")

    recognition.onstart = () => {
      console.log("Voice recognition started")
      alert("🎤 Listening for full job details... Speak all information and we'll fill out the form automatically!")
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setVoiceTranscript(transcript)
      parseVoiceInputEnhanced(transcript)
      setIsRecording(false)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const result = await response.json()
        const parsedData = result.data || result // Handle both new and old response formats
        
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
      const jobId = result.job_id || result.job?.id
      if (jobId) {
        router.push(`/company/job-success/${jobId}`)
      } else {
        throw new Error('Job ID not returned from server')
      }
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
                  Dynamic Voice Input
                </CardTitle>
                <CardDescription>
                  Click the microphone icon next to any field to speak directly into that field. 
                  Watch as your words appear in real-time!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                  <p className="font-medium mb-2">🎯 How it works:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Field-specific:</strong> Click the mic button next to any field to speak directly into it</li>
                    <li><strong>Real-time:</strong> See your words appear as you speak with live transcription</li>
                    <li><strong>Smart processing:</strong> Automatically formats phone numbers, salaries, and job types</li>
                    <li><strong>Easy control:</strong> Click the red mic button to stop recording at any time</li>
                  </ul>
                  <p className="mt-2 text-xs text-blue-600">
                    💡 Pro tip: Speak clearly and pause between words for better accuracy!
                  </p>
                </div>

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
                        Start Full Voice Input
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
                    <p className="text-sm italic">&ldquo;{voiceTranscript}&rdquo;</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manual Form Fields with Voice Input */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Person&apos;s Name *</Label>
                <div className="relative">
                  <Input
                    id="contact_name"
                    value={jobData.contact_name}
                    onChange={(e) => setJobData({ ...jobData, contact_name: e.target.value })}
                    placeholder="Contact person name"
                    required
                    className={currentField === 'contact_name' ? 'border-blue-400 bg-blue-50' : ''}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={currentField === 'contact_name' ? "destructive" : "outline"}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => currentField === 'contact_name' ? stopVoiceInput() : startFieldVoiceInput('contact_name')}
                  >
                    {currentField === 'contact_name' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  {currentField === 'contact_name' && interimText && (
                    <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                      Speaking: {interimText}...
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <div className="relative">
                  <Input
                    id="contact_number"
                    value={jobData.contact_number}
                    onChange={(e) => setJobData({ ...jobData, contact_number: e.target.value })}
                    placeholder="Contact phone number"
                    required
                    className={currentField === 'contact_number' ? 'border-blue-400 bg-blue-50' : ''}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={currentField === 'contact_number' ? "destructive" : "outline"}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => currentField === 'contact_number' ? stopVoiceInput() : startFieldVoiceInput('contact_number')}
                  >
                    {currentField === 'contact_number' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  {currentField === 'contact_number' && interimText && (
                    <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                      Speaking: {interimText}...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <div className="relative">
                  <Input
                    id="company_name"
                    value={jobData.company_name}
                    onChange={(e) => setJobData({ ...jobData, company_name: e.target.value })}
                    placeholder="Tech Corp Inc."
                    required
                    className={currentField === 'company_name' ? 'border-blue-400 bg-blue-50' : ''}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={currentField === 'company_name' ? "destructive" : "outline"}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => currentField === 'company_name' ? stopVoiceInput() : startFieldVoiceInput('company_name')}
                  >
                    {currentField === 'company_name' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  {currentField === 'company_name' && interimText && (
                    <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                      Speaking: {interimText}...
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <div className="relative">
                  <Input
                    id="job_title"
                    value={jobData.job_title}
                    onChange={(e) => setJobData({ ...jobData, job_title: e.target.value })}
                    placeholder="Software Engineer Intern"
                    required
                    className={currentField === 'job_title' ? 'border-blue-400 bg-blue-50' : ''}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={currentField === 'job_title' ? "destructive" : "outline"}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => currentField === 'job_title' ? stopVoiceInput() : startFieldVoiceInput('job_title')}
                  >
                    {currentField === 'job_title' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  {currentField === 'job_title' && interimText && (
                    <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                      Speaking: {interimText}...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type *</Label>
              <div className="relative">
                <Select value={jobData.job_type} onValueChange={(value) => setJobData({ ...jobData, job_type: value })}>
                  <SelectTrigger className={currentField === 'job_type' ? 'border-blue-400 bg-blue-50' : ''}>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant={currentField === 'job_type' ? "destructive" : "outline"}
                  className="absolute right-1 top-1 h-8 w-8 p-0"
                  onClick={() => currentField === 'job_type' ? stopVoiceInput() : startFieldVoiceInput('job_type')}
                >
                  {currentField === 'job_type' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                {currentField === 'job_type' && interimText && (
                  <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700 z-10">
                    Speaking: {interimText}...
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">Job Description *</Label>
              <div className="relative">
                <Textarea
                  id="job_description"
                  value={jobData.job_description}
                  onChange={(e) => setJobData({ ...jobData, job_description: e.target.value })}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  rows={6}
                  required
                  className={currentField === 'job_description' ? 'border-blue-400 bg-blue-50' : ''}
                />
                <Button
                  type="button"
                  size="sm"
                  variant={currentField === 'job_description' ? "destructive" : "outline"}
                  className="absolute right-2 top-2 h-8 w-8 p-0"
                  onClick={() => currentField === 'job_description' ? stopVoiceInput() : startFieldVoiceInput('job_description')}
                >
                  {currentField === 'job_description' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                {currentField === 'job_description' && interimText && (
                  <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                    Speaking: {interimText}...
                  </div>
                )}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Optional Information</h3>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      value={jobData.location}
                      onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                      placeholder="Bangalore, India"
                      className={currentField === 'location' ? 'border-blue-400 bg-blue-50' : ''}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={currentField === 'location' ? "destructive" : "outline"}
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => currentField === 'location' ? stopVoiceInput() : startFieldVoiceInput('location')}
                    >
                      {currentField === 'location' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    {currentField === 'location' && interimText && (
                      <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                        Speaking: {interimText}...
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_stipend">Salary / Stipend</Label>
                  <div className="relative">
                    <Input
                      id="salary_stipend"
                      value={jobData.salary_stipend}
                      onChange={(e) => setJobData({ ...jobData, salary_stipend: e.target.value })}
                      placeholder="₹25,000/month"
                      className={currentField === 'salary_stipend' ? 'border-blue-400 bg-blue-50' : ''}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={currentField === 'salary_stipend' ? "destructive" : "outline"}
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => currentField === 'salary_stipend' ? stopVoiceInput() : startFieldVoiceInput('salary_stipend')}
                    >
                      {currentField === 'salary_stipend' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    {currentField === 'salary_stipend' && interimText && (
                      <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                        Speaking: {interimText}...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_skills">Key Skills</Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Input
                      id="key_skills"
                      value={keySkillInput}
                      onChange={(e) => setKeySkillInput(e.target.value)}
                      placeholder="Add a skill and press Enter"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeySkill())}
                      className={currentField === 'key_skills' ? 'border-blue-400 bg-blue-50' : ''}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={currentField === 'key_skills' ? "destructive" : "outline"}
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => currentField === 'key_skills' ? stopVoiceInput() : startFieldVoiceInput('key_skills')}
                    >
                      {currentField === 'key_skills' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    {currentField === 'key_skills' && interimText && (
                      <div className="absolute top-full left-0 right-0 bg-blue-100 border border-blue-200 rounded-b-md p-2 text-sm text-blue-700">
                        Speaking: {interimText}...
                      </div>
                    )}
                  </div>
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

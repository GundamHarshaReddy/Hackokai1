"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, Eye, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useFieldValidation } from "@/hooks/useFieldValidation"
import { ValidationInput } from "@/components/ValidationInput"

const CORE_VALUES = [
  "Innovation",
  "Collaboration",
  "Leadership",
  "Integrity",
  "Excellence",
  "Creativity",
  "Flexibility",
  "Growth",
  "Impact",
  "Balance",
  "Autonomy",
  "Recognition",
  "Security",
  "Adventure",
  "Service",
]

const WORK_PREFERENCES = [
  { key: "independence", label: "Independent Work ↔ Team Collaboration" },
  { key: "structure", label: "Structured Environment ↔ Flexible Environment" },
  { key: "pace", label: "Steady Pace ↔ Fast-Paced Work" },
  { key: "innovation", label: "Proven Methods ↔ Innovative Approaches" },
  { key: "interaction", label: "Minimal Interaction ↔ High Social Interaction" },
]

const PERSONALITY_QUESTIONS = [
  "I prefer working on detailed, methodical tasks",
  "I enjoy leading team discussions and meetings",
  "I work best under tight deadlines and pressure",
  "I like to explore new ideas and creative solutions",
  "I prefer clear instructions and defined processes",
  "I enjoy mentoring and helping colleagues grow",
  "I thrive in competitive environments",
]

export default function AssessmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Initialize field validation hook
  const { validateField, getFieldValidation, cleanup } = useFieldValidation({
    debounceMs: 800,
    minLength: 3
  })

  // Cleanup validation on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Get redirect URL and phone from query params
  const redirectUrl = searchParams.get("redirect")
  const phoneFromUrl = searchParams.get("phone")

  // Form data
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    email: "",
    phone: phoneFromUrl || "",
    education_degree: "",
    specialization: "",
  })

  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [workPreferences, setWorkPreferences] = useState<Record<string, number>>({
    independence: 50,
    structure: 50,
    pace: 50,
    innovation: 50,
    interaction: 50,
  })
  
  // Track which sliders have been interacted with
  const [touchedSliders, setTouchedSliders] = useState<Record<string, boolean>>({
    independence: false,
    structure: false,
    pace: false,
    innovation: false,
    interaction: false,
  })

  const [personalityScores, setPersonalityScores] = useState<Record<string, number>>({})
  const [recommendations, setRecommendations] = useState<{
    role: string;
    match: number;
    explanation: string;
    openings: number;
  }[]>([])
  
  const [errorMessage, setErrorMessage] = useState<string>("")

  const handleValueToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter((v) => v !== value))
    } else if (selectedValues.length < 5) {
      setSelectedValues([...selectedValues, value])
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setErrorMessage("") // Clear previous error
    
    try {
      // Save student data
      const studentData = {
        ...basicInfo,
        core_values: selectedValues,
        work_preferences: workPreferences,
        personality_scores: personalityScores,
      }

      // Submit assessment via API (includes both student creation and career recommendations)
      const response = await fetch('/api/submit-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to submit assessment')
      }

      const { recommendations, student } = await response.json()
      setRecommendations(recommendations)
      
      // Store student data in sessionStorage for use in opportunities page
      if (student) {
        sessionStorage.setItem('currentStudent', JSON.stringify(student))
      }
      
      setCurrentStep(5)
    } catch (error) {
      console.error("Error saving assessment:", error)
      const errorMsg = error instanceof Error ? error.message : "Error saving assessment. Please try again."
      setErrorMessage(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteAssessment = () => {
    if (redirectUrl) {
      // Redirect back to the job page
      router.push(redirectUrl)
    } else {
      // Go to opportunities page with student context
      router.push("/student/opportunities")
    }
  }

  const handleViewJobsByCareer = (careerType: string) => {
    // Redirect to opportunities page filtered by career type
    router.push(`/student/opportunities?careerType=${encodeURIComponent(careerType)}`)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about yourself to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <ValidationInput
                  id="email"
                  label="Email Address"
                  type="email"
                  value={basicInfo.email}
                  onChange={(value) => {
                    setBasicInfo({ ...basicInfo, email: value })
                    setErrorMessage("") // Clear error when user modifies email
                    validateField('email', value)
                  }}
                  placeholder="your.email@domain.com"
                  required
                  validation={getFieldValidation('email')}
                />
              </div>

              <ValidationInput
                id="phone"
                label="Phone Number"
                value={basicInfo.phone}
                onChange={(value) => {
                  setBasicInfo({ ...basicInfo, phone: value })
                  setErrorMessage("") // Clear error when user modifies phone
                  validateField('phone', value)
                }}
                placeholder="Your phone number"
                required
                validation={getFieldValidation('phone')}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Education Degree *</Label>
                  <Select onValueChange={(value) => setBasicInfo({ ...basicInfo, education_degree: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="B.E">B.E</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="B.Sc">B.Sc</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="M.Sc">M.Sc</SelectItem>
                      <SelectItem value="B.Com">B.Com</SelectItem>
                      <SelectItem value="BBA">BBA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    value={basicInfo.specialization}
                    onChange={(e) => setBasicInfo({ ...basicInfo, specialization: e.target.value })}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Core Values</CardTitle>
              <CardDescription>
                Select exactly 5 values that matter most to you in your career
                <div className="mt-2">
                  <span
                    className={`text-sm font-medium ${selectedValues.length === 5 ? "text-green-600" : "text-blue-600"}`}
                  >
                    Selected: {selectedValues.length}/5
                  </span>
                  {selectedValues.length === 5 && <span className="ml-2 text-green-600">✓ Perfect!</span>}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {CORE_VALUES.map((value) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={value}
                      checked={selectedValues.includes(value)}
                      onCheckedChange={() => handleValueToggle(value)}
                      disabled={!selectedValues.includes(value) && selectedValues.length >= 5}
                    />
                    <Label htmlFor={value} className="text-sm cursor-pointer">
                      {value}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Work Preferences</CardTitle>
              <CardDescription>Adjust the sliders to reflect your ideal work environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {WORK_PREFERENCES.map((pref) => (
                <div key={pref.key} className="space-y-3">
                  <Label className="text-sm font-medium">{pref.label}</Label>
                  <Slider
                    value={[workPreferences[pref.key]]}
                    onValueChange={(value) => {
                      setWorkPreferences({
                        ...workPreferences,
                        [pref.key]: value[0],
                      })
                      // Mark this slider as touched/interacted with
                      setTouchedSliders({
                        ...touchedSliders,
                        [pref.key]: true,
                      })
                    }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-500">{workPreferences[pref.key]}%</div>
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Personality Assessment</CardTitle>
              <CardDescription>
                Rate how much you agree with each statement (1 = Strongly Disagree, 5 = Strongly Agree)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {PERSONALITY_QUESTIONS.map((question, index) => (
                <div key={index} className="space-y-3">
                  <Label className="text-sm font-medium">{question}</Label>
                  <RadioGroup
                    value={personalityScores[index]?.toString() || ""}
                    onValueChange={(value) =>
                      setPersonalityScores({
                        ...personalityScores,
                        [index]: Number.parseInt(value),
                      })
                    }
                    className="flex justify-between"
                  >
                    {[1, 2, 3, 4, 5].map((score) => (
                      <div key={score} className="flex flex-col items-center space-y-2">
                        <RadioGroupItem value={score.toString()} id={`q${index}-${score}`} />
                        <Label htmlFor={`q${index}-${score}`} className="text-xs">
                          {score}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Your Career Recommendations</CardTitle>
              <CardDescription>
                Based on your assessment, here are your top career matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="border-2 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{rec.role}</CardTitle>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{rec.match}%</div>
                          <div className="text-sm text-gray-500">Match</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{rec.explanation}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-600">{rec.openings} openings available</span>
                        <Button size="sm" onClick={() => handleViewJobsByCareer(rec.role)}>
                          <Eye className="mr-1 h-3 w-3" />
                          View Jobs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-center mt-8">
                <Button onClick={handleCompleteAssessment} size="lg">
                  {redirectUrl ? "Continue to Job" : "Explore All Opportunities"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Check basic info completeness
        const basicInfoComplete = Object.values(basicInfo).every((value) => value.trim() !== "")
        if (!basicInfoComplete) return false
        
        // Check if email and phone are valid
        const emailValid = getFieldValidation('email')?.isValid
        const phoneValid = getFieldValidation('phone')?.isValid
        if (!emailValid || !phoneValid) return false
        
        return true
      case 2:
        return selectedValues.length === 5
      case 3:
        // Check if user has interacted with ALL work preference sliders
        const allSlidersInteracted = Object.values(touchedSliders).every(touched => touched === true)
        
        return allSlidersInteracted
      case 4:
        return Object.keys(personalityScores).length === PERSONALITY_QUESTIONS.length
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Progress value={(currentStep / 5) * 100} className="w-full max-w-2xl mx-auto" />
          <p className="text-center mt-2 text-sm text-gray-600">Step {currentStep} of 5</p>
          {redirectUrl && (
            <p className="text-center mt-1 text-xs text-blue-600">Complete assessment to access the job opportunity</p>
          )}
        </div>

        {renderStep()}

        {/* Error Message Display */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {currentStep < 5 && (
          <div className="flex justify-between max-w-2xl mx-auto mt-8">
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep === 4 ? (
              <Button onClick={handleSubmit} disabled={!canProceed() || loading}>
                {loading ? "Processing..." : "Complete Assessment"}
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

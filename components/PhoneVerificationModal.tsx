"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Loader2, AlertCircle } from "lucide-react"

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

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerificationSuccess: (studentData: Student) => void
  onNewStudent: () => void
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  onVerificationSuccess,
  onNewStudent,
}: PhoneVerificationModalProps) {
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerifyPhone = async () => {
    if (!phone.trim() || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/check-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.exists) {
          // Store student data in session
          sessionStorage.setItem('currentStudent', JSON.stringify(data.student))
          onVerificationSuccess(data.student)
        } else {
          // Redirect to assessment
          onNewStudent()
        }
      } else {
        setError(data.error || 'Failed to verify phone number')
      }
    } catch (error) {
      console.error('Error verifying phone:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Verification
          </CardTitle>
          <CardDescription>
            Enter your phone number to continue with job application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="tel"
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              className="text-center text-lg"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleVerifyPhone}
              disabled={loading || phone.length !== 10}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

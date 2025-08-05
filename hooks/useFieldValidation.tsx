import { useState, useCallback, useRef } from 'react'

interface ValidationResult {
  isValid: boolean
  isChecking: boolean
  message: string
  field: string
}

interface UseFieldValidationOptions {
  debounceMs?: number
  minLength?: number
}

export function useFieldValidation(options: UseFieldValidationOptions = {}) {
  const { debounceMs = 800, minLength = 3 } = options
  
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})
  const abortControllersRef = useRef<Record<string, AbortController>>({})

  const validateField = useCallback(async (field: 'email' | 'phone', value: string) => {
    // Clear any existing timeout for this field
    if (timeoutRefs.current[field]) {
      clearTimeout(timeoutRefs.current[field])
    }

    // Cancel any existing request for this field
    if (abortControllersRef.current[field]) {
      abortControllersRef.current[field].abort()
    }

    // Reset validation state immediately - clear everything when input changes
    setValidationResults(prev => ({
      ...prev,
      [field]: {
        isValid: true,
        isChecking: false,
        message: '',
        field
      }
    }))

    // Don't validate if value is empty - completely clear validation
    if (!value || value.trim().length === 0) {
      setValidationResults(prev => {
        const newResults = { ...prev }
        delete newResults[field]
        return newResults
      })
      return
    }

    // Don't validate if value is too short
    if (value.trim().length < minLength) {
      return
    }

    // Basic format validation first
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.trim())) {
        setValidationResults(prev => ({
          ...prev,
          [field]: {
            isValid: false,
            isChecking: false,
            message: 'Please enter a valid email address',
            field
          }
        }))
        return
      }
    }

    if (field === 'phone') {
      // Clean phone number - remove spaces, dashes, parentheses
      const cleanPhone = value.trim().replace(/[\s\-\(\)]/g, '')
      
      // Check for exactly 10 digits (Indian phone number format)
      const phoneRegex = /^[6-9]\d{9}$/
      
      if (!phoneRegex.test(cleanPhone)) {
        setValidationResults(prev => ({
          ...prev,
          [field]: {
            isValid: false,
            isChecking: false,
            message: 'Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9',
            field
          }
        }))
        return
      }
    }

    // Set checking state
    setValidationResults(prev => ({
      ...prev,
      [field]: {
        isValid: true,
        isChecking: true,
        message: `Checking ${field} availability...`,
        field
      }
    }))

    // Debounce the validation check
    timeoutRefs.current[field] = setTimeout(async () => {
      try {
        // Create abort controller for this request
        const abortController = new AbortController()
        abortControllersRef.current[field] = abortController

        // Make API call to validate field
        const response = await fetch('/api/validate-field', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ field, value: value.trim() }),
          signal: abortController.signal
        })

        const result = await response.json()

        if (result.valid === false) {
          if (result.error === 'Email already exists' && field === 'email') {
            setValidationResults(prev => ({
              ...prev,
              [field]: {
                isValid: false,
                isChecking: false,
                message: 'This email address is already registered. Please use a different email address.',
                field
              }
            }))
          } else if (result.error === 'Phone number already exists' && field === 'phone') {
            setValidationResults(prev => ({
              ...prev,
              [field]: {
                isValid: false,
                isChecking: false,
                message: 'This phone number is already registered. Please use a different phone number.',
                field
              }
            }))
          } else {
            // Other error - don't block user
            setValidationResults(prev => ({
              ...prev,
              [field]: {
                isValid: true,
                isChecking: false,
                message: 'Unable to verify availability. Please continue.',
                field
              }
            }))
          }
        } else {
          // No error means the field is available
          setValidationResults(prev => ({
            ...prev,
            [field]: {
              isValid: true,
              isChecking: false,
              message: '', // No message for available fields
              field
            }
          }))
        }
      } catch (error) {
        // Don't show error if request was aborted (user is still typing)
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        console.error('Field validation error:', error)
        setValidationResults(prev => ({
          ...prev,
          [field]: {
            isValid: true, // Don't block user on validation errors
            isChecking: false,
            message: 'Unable to verify availability. Please continue.',
            field
          }
        }))
      } finally {
        // Clean up the abort controller
        delete abortControllersRef.current[field]
      }
    }, debounceMs)
  }, [minLength])

  const clearValidation = useCallback((field: string) => {
    // Clear timeout
    if (timeoutRefs.current[field]) {
      clearTimeout(timeoutRefs.current[field])
      delete timeoutRefs.current[field]
    }

    // Cancel request
    if (abortControllersRef.current[field]) {
      abortControllersRef.current[field].abort()
      delete abortControllersRef.current[field]
    }

    // Clear validation state
    setValidationResults(prev => {
      const newResults = { ...prev }
      delete newResults[field]
      return newResults
    })
  }, [])

  const getFieldValidation = useCallback((field: string): ValidationResult => {
    return validationResults[field] || {
      isValid: true,
      isChecking: false,
      message: '',
      field
    }
  }, [validationResults])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current = {}

    // Abort all ongoing requests
    Object.values(abortControllersRef.current).forEach(controller => controller.abort())
    abortControllersRef.current = {}

    // Clear all validation results
    setValidationResults({})
  }, [])

  return {
    validateField,
    clearValidation,
    getFieldValidation,
    cleanup
  }
}

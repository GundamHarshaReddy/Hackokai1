import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ValidationInputProps {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  validation?: {
    isValid: boolean
    isChecking: boolean
    message: string
  }
}

export function ValidationInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  validation
}: ValidationInputProps) {
  const handleInputChange = (inputValue: string) => {
    // Special handling for phone numbers
    if (id === 'phone') {
      // Remove all non-digit characters
      const digitsOnly = inputValue.replace(/\D/g, '')
      
      // Limit to 10 digits
      const limitedDigits = digitsOnly.slice(0, 10)
      
      onChange(limitedDigits)
    } else {
      onChange(inputValue)
    }
  }

  const getValidationIcon = () => {
    if (!validation) return null
    
    if (validation.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    
    if (value && validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    if (value && !validation.isValid) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    
    return null
  }

  const getValidationMessage = () => {
    if (!validation || !value) return null
    
    return (
      <p className={`text-sm mt-1 ${
        validation.isValid ? 'text-green-600' : 'text-red-600'
      }`}>
        {validation.message}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id={id}
          type={id === 'phone' ? 'tel' : type}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          maxLength={id === 'phone' ? 10 : undefined}
          className={`pr-10 ${
            validation && value
              ? validation.isValid
                ? 'border-green-500 focus:border-green-500'
                : 'border-red-500 focus:border-red-500'
              : ''
          }`}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getValidationIcon()}
        </div>
      </div>
      
      {getValidationMessage()}
    </div>
  )
}

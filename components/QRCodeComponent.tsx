"use client"

import { useRef, useState, useEffect } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface QRCodeComponentProps {
  jobId: string
  size?: number
  className?: string
  showDownload?: boolean
}

export function QRCodeComponent({ 
  jobId, 
  size = 256, 
  className = "",
  showDownload = true 
}: QRCodeComponentProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before rendering QR code
  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate the job URL with production-ready environment detection
  const getJobUrl = () => {
    // Get base URL from environment, defaulting to production
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hackokai.vercel.app'
    
    // Only use localhost in true development environment
    const isLocalDevelopment = 
      process.env.NODE_ENV === 'development' && 
      !process.env.VERCEL && // Not on Vercel
      !process.env.RAILWAY_ENVIRONMENT && // Not on Railway
      !process.env.NETLIFY // Not on Netlify
    
    if (isLocalDevelopment) {
      baseUrl = 'http://localhost:3000'
    }
    
    // For client-side detection, also check window location
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1'
      if (isLocalhost && process.env.NODE_ENV === 'development') {
        baseUrl = `${window.location.protocol}//${window.location.host}`
      }
    }
    
    console.log(`QRComponent - Environment: ${process.env.NODE_ENV}, VERCEL: ${!!process.env.VERCEL}, isLocalDev: ${isLocalDevelopment}, baseUrl: ${baseUrl}`)
    
    return `${baseUrl}/job/${jobId}`
  }

  const jobUrl = getJobUrl()

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `${jobId}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Don't render until mounted (prevents SSR issues)
  if (!mounted) {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className="p-4 bg-white rounded-lg shadow-md border flex items-center justify-center" style={{width: size + 32, height: size + 32}}>
          <div className="text-gray-500">Loading QR Code...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div 
        ref={qrRef}
        className="p-4 bg-white rounded-lg shadow-md border"
      >
        <QRCodeCanvas
          value={jobUrl}
          size={size}
          level="M"
          includeMargin={true}
        />
      </div>
      
      {showDownload && (
        <Button
          onClick={downloadQRCode}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </Button>
      )}
      
      <div className="text-center text-sm text-gray-600 max-w-xs">
        <p className="font-medium">Scan to view job details</p>
        <p className="text-xs mt-1 break-all">{jobUrl}</p>
      </div>
    </div>
  )
}

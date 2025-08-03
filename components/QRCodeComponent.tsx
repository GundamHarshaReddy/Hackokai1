"use client"

import { useRef } from "react"
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

  // Generate the job URL
  const getJobUrl = () => {
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    if (!baseUrl || baseUrl.includes('localhost')) {
      baseUrl = 'https://hackokai.vercel.app'
    }
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

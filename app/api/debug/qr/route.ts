import { NextResponse } from 'next/server'
import { generateQRCodeURL } from '@/lib/qr-generator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  
  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
  }

  // Force generate QR with current environment
  const qrUrl = generateQRCodeURL(jobId)
  
  return NextResponse.json({
    jobId,
    qrCodeUrl: qrUrl,
    directUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/job/${jobId}`
  })
}

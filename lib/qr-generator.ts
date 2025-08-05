export function generateQRCodeURL(jobId: string): string {
  // Production-ready QR code generation
  
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
  
  console.log(`QR Generator - Environment: ${process.env.NODE_ENV}, VERCEL: ${!!process.env.VERCEL}, isLocalDev: ${isLocalDevelopment}, baseUrl: ${baseUrl}`)
  
  const jobUrl = `${baseUrl}/job/${jobId}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(jobUrl)}&format=png`
}

export function generateJobId(): string {
  const prefix = "JOB"
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}_${randomNum}`
}

// Function to download QR code as image
export async function downloadQRCode(qrCodeUrl: string, filename: string): Promise<void> {
  try {
    const response = await fetch(qrCodeUrl)
    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error downloading QR code:", error)
    // Fallback: open QR code in new tab
    window.open(qrCodeUrl, "_blank")
  }
}

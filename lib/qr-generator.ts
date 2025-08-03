export function generateQRCodeURL(jobId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL environment variable is not set")
  }
  
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

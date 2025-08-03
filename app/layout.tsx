import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hackokai - AI-Powered Career Matching Platform",
  description: "Revolutionary career platform that bridges students and employers using smart QR technology, comprehensive assessments, and intelligent compatibility matching.",
  keywords: "career, jobs, AI matching, students, employers, assessment, QR code",
  authors: [{ name: "Hackokai Team" }],
  openGraph: {
    title: "Hackokai - AI-Powered Career Matching Platform",
    description: "Revolutionary career platform that bridges students and employers using smart QR technology, comprehensive assessments, and intelligent compatibility matching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

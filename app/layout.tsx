import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trendy AI - TikTok Trends Analyzer',
  description: 'AI-powered TikTok account analysis and content recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="trendy" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen`}>{children}</body>
    </html>
  )
}


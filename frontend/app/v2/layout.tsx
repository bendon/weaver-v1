import '@/v2/styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TravelWeaver V2 - AI-Powered DMC Platform',
  description: 'Destination Management Company platform with AI-powered travel planning',
}

export default function V2RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

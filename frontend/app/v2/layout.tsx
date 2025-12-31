'use client'

import '@/v2/styles/globals.css'
import { AuthProvider } from '@/v2/contexts/AuthContext'

export default function V2RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

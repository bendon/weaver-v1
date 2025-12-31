'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/v2/lib/api'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  organization_id?: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          // Decode JWT to get user info (basic decode, no verification on client)
          const payload = JSON.parse(atob(token.split('.')[1]))

          // Check if token is expired
          if (payload.exp * 1000 < Date.now()) {
            // Token expired, try to refresh
            await refreshTokens()
          } else {
            setUser({
              id: payload.sub,
              email: payload.email,
              full_name: payload.full_name || payload.email,
              role: payload.role,
              organization_id: payload.org_id,
              permissions: payload.permissions || []
            })
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
        // Clear invalid tokens
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const refreshTokens = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        throw new Error('No refresh token')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) {
        throw new Error('Refresh failed')
      }

      const data = await response.json()

      if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.access_token)

        // Decode new token
        const payload = JSON.parse(atob(data.data.access_token.split('.')[1]))
        setUser({
          id: payload.sub,
          email: payload.email,
          full_name: payload.full_name || payload.email,
          role: payload.role,
          organization_id: payload.org_id,
          permissions: payload.permissions || []
        })
      } else {
        throw new Error('Invalid refresh response')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear tokens and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      router.push('/v2/auth/login')
    }
  }

  const login = async (email: string, password: string) => {
    const response = await apiClient.auth.login(email, password)

    if (response.success && response.data) {
      // Store tokens
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)

      // Decode token to get user info
      const payload = JSON.parse(atob(response.data.access_token.split('.')[1]))

      setUser({
        id: payload.sub,
        email: payload.email,
        full_name: payload.full_name || payload.email,
        role: payload.role,
        organization_id: payload.org_id,
        permissions: payload.permissions || []
      })

      // Redirect to dashboard
      router.push('/v2/dmc/dashboard')
    } else {
      throw new Error(response.message || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    router.push('/v2/auth/login')
  }

  const refreshAuth = async () => {
    await refreshTokens()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

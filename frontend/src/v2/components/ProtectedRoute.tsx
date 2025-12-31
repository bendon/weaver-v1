'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/v2/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export default function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/v2/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Check permissions if required
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(permission =>
        user?.permissions.includes(permission) || user?.permissions.includes(permission.split(':')[0] + ':*')
      )

      if (!hasPermission) {
        // Redirect to dashboard with error
        router.push('/v2/dmc/dashboard?error=insufficient_permissions')
      }
    }
  }, [isLoading, isAuthenticated, user, requiredPermissions, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission =>
      user?.permissions.includes(permission) || user?.permissions.includes(permission.split(':')[0] + ':*')
    )

    if (!hasPermission) {
      return null
    }
  }

  return <>{children}</>
}

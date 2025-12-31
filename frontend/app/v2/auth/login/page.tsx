'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/v2/contexts/AuthContext'
import '@/v2/styles/globals.css'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Login function handles redirect
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold mb-2">TravelWeaver</h1>
          <p className="text-secondary">DMC Portal Login</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="card p-4 border-l-2 border-l-black bg-subtle">
              <p className="text-sm text-secondary">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-secondary">Remember me</span>
            </label>
            <Link href="/v2/auth/forgot-password" className="text-sm text-secondary hover:text-primary">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-secondary">
            Don't have an account?{' '}
            <Link href="/v2/auth/register" className="font-medium text-primary hover:underline">
              Contact your administrator
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-default text-center">
          <p className="text-xs text-tertiary">
            TravelWeaver V2 - AI-Powered DMC Platform
          </p>
        </div>
      </div>
    </div>
  )
}

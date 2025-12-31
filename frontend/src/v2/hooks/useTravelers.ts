import { useState, useEffect } from 'react'
import { apiClient } from '@/v2/lib/api'

export interface Traveler {
  id: string
  organization_id: string
  name: string
  email: string
  phone: string
  nationality: string
  passport?: {
    number: string
    country: string
    issue_date: string
    expiry_date: string
  }
  preferences: {
    dietary_restrictions?: string[]
    accessibility_needs?: string[]
    room_preferences?: string[]
    interests?: string[]
  }
  emergency_contact?: {
    name: string
    relationship: string
    phone: string
    email?: string
  }
  travel_history: Array<{
    destination: string
    dates: string
    booking_id: string
  }>
  total_bookings: number
  total_spent: number
  tags?: string[]
  created_at: string
  updated_at: string
}

interface UseTravelersOptions {
  page?: number
  per_page?: number
  search?: string
  autoFetch?: boolean
}

export function useTravelers(options: UseTravelersOptions = {}) {
  const { page = 1, per_page = 20, search, autoFetch = true } = options

  const [travelers, setTravelers] = useState<Traveler[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })

  const fetchTravelers = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: any = { page, per_page }
      if (search) params.search = search

      const response = await apiClient.travelers.list(params)

      if (response.success && response.data) {
        setTravelers(response.data as Traveler[])
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setError(response.message || 'Failed to fetch travelers')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching travelers')
      setTravelers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchTravelers()
    }
  }, [page, per_page, search, autoFetch])

  return {
    travelers,
    loading,
    error,
    pagination,
    refetch: fetchTravelers
  }
}

export function useTraveler(id: string, autoFetch = true) {
  const [traveler, setTraveler] = useState<Traveler | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTraveler = async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.travelers.get(id)

      if (response.success && response.data) {
        setTraveler(response.data as Traveler)
      } else {
        setError(response.message || 'Failed to fetch traveler')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching traveler')
      setTraveler(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && id) {
      fetchTraveler()
    }
  }, [id, autoFetch])

  return {
    traveler,
    loading,
    error,
    refetch: fetchTraveler
  }
}

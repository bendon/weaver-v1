import { useState, useEffect } from 'react'
import { apiClient } from '@/v2/lib/api'

export interface Booking {
  id: string
  booking_code: string
  organization_id: string
  traveler_id: string
  traveler?: {
    name: string
    email: string
  }
  trip: {
    destination: string
    start_date: string
    end_date: string
    duration_days: number
  }
  services: {
    flights?: any[]
    hotels?: any[]
    transport?: any[]
    experiences?: any[]
  }
  pricing: {
    subtotal: number
    taxes: number
    fees: number
    total: number
    currency: string
  }
  payment: {
    status: string
    method?: string
    deposit_amount?: number
    balance_amount?: number
    deposit_paid_at?: string
    balance_due_date?: string
  }
  status: string
  created_at: string
  updated_at: string
}

interface UseBookingsOptions {
  page?: number
  per_page?: number
  status?: string
  search?: string
  autoFetch?: boolean
}

export function useBookings(options: UseBookingsOptions = {}) {
  const { page = 1, per_page = 20, status, search, autoFetch = true } = options

  const [bookings, setBookings] = useState<Booking[]>([])
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

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)

    try {
      const params: any = { page, per_page }
      if (status) params.status = status
      if (search) params.search = search

      const response = await apiClient.bookings.list(params)

      if (response.success && response.data) {
        setBookings(response.data as Booking[])
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setError(response.message || 'Failed to fetch bookings')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchBookings()
    }
  }, [page, per_page, status, search, autoFetch])

  return {
    bookings,
    loading,
    error,
    pagination,
    refetch: fetchBookings
  }
}

export function useBooking(id: string, autoFetch = true) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.bookings.get(id)

      if (response.success && response.data) {
        setBooking(response.data as Booking)
      } else {
        setError(response.message || 'Failed to fetch booking')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching booking')
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && id) {
      fetchBooking()
    }
  }, [id, autoFetch])

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking
  }
}

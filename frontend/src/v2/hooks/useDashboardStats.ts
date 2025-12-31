import { useState, useEffect } from 'react'
import { useBookings } from './useBookings'

export interface DashboardStats {
  activeBookings: number
  departingThisWeek: number
  travelersInTrip: number
  completedMTD: number
  revenueMTD: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    activeBookings: 0,
    departingThisWeek: 0,
    travelersInTrip: 0,
    completedMTD: 0,
    revenueMTD: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch all bookings to calculate stats
  const { bookings, loading: bookingsLoading } = useBookings({ per_page: 1000 })

  useEffect(() => {
    if (!bookingsLoading && bookings.length >= 0) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfWeek = new Date(now)
      endOfWeek.setDate(now.getDate() + 7)

      const activeCount = bookings.filter(b =>
        ['confirmed', 'in_progress', 'pending'].includes(b.status)
      ).length

      const departingCount = bookings.filter(b => {
        const startDate = new Date(b.trip.start_date)
        return startDate >= now && startDate <= endOfWeek &&
               ['confirmed', 'in_progress'].includes(b.status)
      }).length

      const inTripCount = bookings.filter(b => {
        const startDate = new Date(b.trip.start_date)
        const endDate = new Date(b.trip.end_date)
        return startDate <= now && endDate >= now && b.status === 'in_progress'
      }).length

      const completedCount = bookings.filter(b => {
        const completedDate = new Date(b.updated_at)
        return b.status === 'completed' && completedDate >= startOfMonth
      }).length

      const revenue = bookings
        .filter(b => {
          const completedDate = new Date(b.updated_at)
          return b.status === 'completed' && completedDate >= startOfMonth
        })
        .reduce((sum, b) => sum + (b.pricing?.total || 0), 0)

      setStats({
        activeBookings: activeCount,
        departingThisWeek: departingCount,
        travelersInTrip: inTripCount,
        completedMTD: completedCount,
        revenueMTD: revenue
      })
      setLoading(false)
    }
  }, [bookings, bookingsLoading])

  return { stats, loading }
}

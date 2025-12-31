'use client'

import { Calendar, Users, TrendingUp, DollarSign, Clock, AlertCircle, Plane } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/v2/contexts/AuthContext'
import { useDashboardStats } from '@/v2/hooks/useDashboardStats'
import { useBookings } from '@/v2/hooks/useBookings'

export default function DashboardPage() {
  const { user } = useAuth()
  const { stats, loading: statsLoading } = useDashboardStats()
  const { bookings, loading: bookingsLoading } = useBookings({ per_page: 10, status: 'in_progress,confirmed' })

  // Format revenue
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Get user's first name
  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const statsData = [
    { label: 'Active Bookings', value: statsLoading ? '...' : stats.activeBookings.toString(), change: null, icon: Calendar },
    { label: 'Departing This Week', value: statsLoading ? '...' : stats.departingThisWeek.toString(), change: null, icon: Clock },
    { label: 'Travelers In-Trip', value: statsLoading ? '...' : stats.travelersInTrip.toString(), change: null, icon: Users },
    { label: 'Completed (Month)', value: statsLoading ? '...' : stats.completedMTD.toString(), change: null, icon: TrendingUp },
    { label: 'Revenue (Month)', value: statsLoading ? '...' : formatCurrency(stats.revenueMTD), change: null, icon: DollarSign },
  ]

  const alerts = [
    {
      type: 'urgent',
      title: 'Flight KQ100 Delayed 2 Hours',
      message: 'ABC123 · Smith Family · Return flight to London',
      time: '10 mins ago',
      action: 'Notify'
    },
    {
      type: 'response',
      title: 'Traveler Question',
      message: '"What should I pack for the safari?" — Jane Chen',
      time: null,
      action: 'Respond'
    },
    {
      type: 'reminder',
      title: 'Send Visa Reminder',
      message: 'DEF456 · Johnson Family · 10 days until departure',
      time: null,
      action: 'Send'
    }
  ]

  const todayDepartures = [
    {
      traveler: 'Smith Family',
      route: 'NBO → MRE (Masai Mara)',
      time: '09:15',
      status: 'on-time'
    },
    {
      traveler: 'Johnson Group',
      route: 'NBO → ABK (Amboseli)',
      time: '14:30',
      status: 'on-time'
    },
    {
      traveler: 'Chen Couple',
      route: 'MRE → NBO',
      time: '21:15',
      status: 'delayed'
    }
  ]

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1>Good morning, {firstName}</h1>
              <p className="text-secondary mt-1">Here's what's happening with your bookings today.</p>
            </div>
            <Link href="/v2/dmc/bookings" className="btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {statsData.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="card p-5">
                <p className="text-sm text-secondary">{stat.label}</p>
                <p className="mt-3" style={{ fontFamily: "'EB Garamond', serif", fontSize: '32px', fontWeight: 400, lineHeight: 1 }}>
                  {stat.value}
                  {stat.change && (
                    <span style={{ fontFamily: "'Geist', sans-serif", fontSize: '14px', color: 'var(--color-text-tertiary)' }}>
                      {' '}{stat.change}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>

        <div className="flex gap-6">
          {/* Alerts */}
          <div className="card flex-1" style={{ minWidth: 0 }}>
            <div className="px-5 py-4 border-b border-default flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full"></span>
                <span className="font-medium">Active Alerts</span>
              </div>
              <span className="text-sm text-tertiary">3 require attention</span>
            </div>
            <div>
              {alerts.map((alert, idx) => (
                <div key={idx} className={`px-5 py-5 ${idx < alerts.length - 1 ? 'border-b border-default' : ''} hover:bg-gray-50 cursor-pointer`}>
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'urgent' ? 'bg-black text-white' : 'bg-subtle'
                    }`}>
                      {alert.type === 'urgent' ? (
                        <span className="text-white font-semibold">!</span>
                      ) : alert.type === 'response' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {alert.type === 'urgent' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">URGENT</span>
                        )}
                        {alert.type === 'response' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">RESPONSE NEEDED</span>
                        )}
                        {alert.type === 'reminder' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(0,0,0,0.06)' }}>REMINDER</span>
                        )}
                        {alert.time && (
                          <span className="text-xs text-tertiary">{alert.time}</span>
                        )}
                      </div>
                      <p className="font-medium mt-2" style={{ fontFamily: "'Geist', sans-serif" }}>{alert.title}</p>
                      <p className="text-sm text-secondary mt-1">{alert.message}</p>
                      <button className="mt-3 text-sm font-medium hover:underline">{alert.action}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Departures */}
          <div className="card" style={{ width: '340px', flexShrink: 0 }}>
            <div className="px-5 py-4 border-b border-default">
              <span className="font-medium">Today's Departures</span>
            </div>
            <div>
              {todayDepartures.map((departure, idx) => (
                <div key={idx} className={`px-5 py-4 ${idx < todayDepartures.length - 1 ? 'border-b border-default' : ''} hover:bg-gray-50 cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>
                        {departure.traveler}
                      </p>
                      <p className="text-sm text-secondary mt-0.5">{departure.route}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{departure.time}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        departure.status === 'delayed' 
                          ? 'bg-black text-white' 
                          : 'border border-black'
                      }`}>
                        {departure.status === 'delayed' ? 'Delayed' : 'On Time'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-default">
              <Link href="/v2/dmc/flight-monitor" className="w-full text-sm text-center text-secondary hover:text-primary block">
                View All Flights →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

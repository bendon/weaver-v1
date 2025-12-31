'use client'

import { Calendar, Users, TrendingUp, DollarSign, Clock, AlertCircle, Plane } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    { label: 'Active Bookings', value: '47', change: '+3 this week', icon: Calendar },
    { label: 'Departing This Week', value: '12', change: '3 today', icon: Clock },
    { label: 'Travelers In-Trip', value: '28', change: 'Across 8 bookings', icon: Users },
    { label: 'Completed (MTD)', value: '156', change: '+12%', trend: 'up', icon: TrendingUp },
    { label: 'Revenue (MTD)', value: '$428K', change: '+8.2%', trend: 'up', icon: DollarSign },
  ]

  const alerts = [
    {
      type: 'urgent',
      title: 'Flight Delay - BK-2025-XJ8K9P',
      message: 'Flight UA234 delayed by 2 hours. Traveler Sarah Chen has been notified.',
      time: '15 min ago'
    },
    {
      type: 'info',
      title: 'Payment Received - BK-2025-L9M2N4',
      message: 'Final payment of $4,250 received for booking. Trip starts in 3 days.',
      time: '1 hour ago'
    },
    {
      type: 'warning',
      title: 'Document Missing - BK-2025-P7Q8R9',
      message: 'Passport copy still pending for traveler Michael Brown.',
      time: '2 hours ago'
    }
  ]

  const todayDepartures = [
    {
      code: 'BK-2025-XJ8K9P',
      traveler: 'Sarah Chen',
      destination: 'Tokyo',
      flight: 'UA234',
      time: '14:30',
      status: 'delayed'
    },
    {
      code: 'BK-2025-M3N4P5',
      traveler: 'Robert Kim',
      destination: 'Paris',
      flight: 'AF456',
      time: '18:45',
      status: 'on-time'
    },
    {
      code: 'BK-2025-Q6R7S8',
      traveler: 'Emily Davis',
      destination: 'London',
      flight: 'BA789',
      time: '21:15',
      status: 'on-time'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-1">Good afternoon, Sarah</h1>
              <p className="text-secondary">Here's what's happening with your bookings today.</p>
            </div>
            <button className="btn-primary px-6 py-2.5 rounded-lg font-medium">
              + New Booking
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="col-span-8 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div key={idx} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-tertiary">
                        <Icon size={20} />
                      </div>
                      {stat.trend === 'up' && (
                        <div className="text-xs text-secondary flex items-center gap-1">
                          <TrendingUp size={12} />
                          {stat.change}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-semibold mb-1">{stat.value}</div>
                    <div className="text-sm text-secondary">{stat.label}</div>
                    {!stat.trend && (
                      <div className="text-xs text-tertiary mt-1">{stat.change}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active Alerts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl">Active Alerts</h2>
                <a href="#" className="text-sm text-secondary hover:text-primary">View all →</a>
              </div>
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`card p-4 ${
                      alert.type === 'urgent' ? 'border-l-2 border-l-black' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <AlertCircle size={18} className={alert.type === 'urgent' ? '' : 'text-tertiary'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="text-sm font-medium">{alert.title}</h3>
                          <span className="text-xs text-tertiary whitespace-nowrap">{alert.time}</span>
                        </div>
                        <p className="text-sm text-secondary">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-span-4">
            <div className="card p-5">
              <h3 className="text-lg font-semibold mb-4">Today's Departures</h3>
              <div className="space-y-4">
                {todayDepartures.map((departure, idx) => (
                  <div key={idx} className="pb-4 border-b border-default last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium mb-0.5">{departure.traveler}</div>
                        <div className="text-xs text-secondary">{departure.code}</div>
                      </div>
                      <span
                        className={`badge text-xs ${
                          departure.status === 'delayed'
                            ? 'badge-alert'
                            : 'badge-active'
                        }`}
                      >
                        {departure.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Plane size={14} />
                      <span>{departure.flight}</span>
                      <span>→</span>
                      <span>{departure.destination}</span>
                    </div>
                    <div className="text-xs text-tertiary mt-1 font-mono">{departure.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

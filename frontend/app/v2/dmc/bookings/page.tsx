'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function BookingsPage() {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)

  const bookings = [
    {
      code: 'ABC123',
      traveler: 'Smith Family',
      travelerCount: 2,
      trip: 'Kenya Safari Adventure',
      route: 'NBO → Masai Mara → NBO',
      dates: 'Mar 15 – 22, 2025',
      nights: 7,
      status: 'active',
      statusText: 'Active · Day 3',
      value: '$4,720'
    },
    {
      code: 'DEF456',
      traveler: 'Johnson Family',
      travelerCount: 4,
      trip: 'Tanzania Serengeti',
      route: 'JRO → Serengeti → Ngorongoro',
      dates: 'Mar 28 – Apr 5, 2025',
      nights: 8,
      status: 'upcoming',
      statusText: 'Upcoming',
      value: '$12,450'
    },
    {
      code: 'GHI789',
      traveler: 'Chen Couple',
      travelerCount: 2,
      trip: 'Kenya Safari + Beach',
      route: 'NBO → Mara → Diani Beach',
      dates: 'Apr 10 – 20, 2025',
      nights: 10,
      status: 'draft',
      statusText: 'Draft',
      value: '$5,890'
    },
    {
      code: 'JKL012',
      traveler: 'Williams Group',
      travelerCount: 6,
      trip: 'Uganda Gorilla Trek',
      route: 'EBB → Bwindi → Queen Elizabeth',
      dates: 'Feb 20 – 28, 2025',
      nights: 8,
      status: 'completed',
      statusText: 'Completed',
      value: '$18,200'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      'active': 'badge-active',
      'upcoming': 'badge-upcoming',
      'draft': 'badge-draft',
      'completed': 'badge-completed'
    }
    return badges[status as keyof typeof badges] || 'badge-draft'
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const bookingDetails: Record<string, any> = {
    'ABC123': {
      code: 'ABC123',
      trip: 'Kenya Safari Adventure',
      status: 'active',
      statusText: 'Active · Day 3',
      travelers: [
        { name: 'John Smith', phone: '+44 7911 234567', initials: 'JS' },
        { name: 'Jane Smith', phone: '+44 7911 234568', initials: 'JS' }
      ],
      returnFlight: {
        code: 'KQ100',
        date: 'Mar 22',
        route: 'NBO → LHR',
        departure: '23:55 departure',
        status: 'delayed',
        delay: '2h'
      },
      itinerary: {
        today: {
          day: 3,
          date: 'Monday, March 17',
          activities: [
            { time: '06:00', icon: '🦁', title: 'Morning Game Drive', location: 'Masai Mara National Reserve' },
            { time: '10:00', icon: '🍽️', title: 'Rest & Lunch', location: 'Mara Serena Safari Lodge' },
            { time: '15:30', icon: '🦁', title: 'Afternoon Game Drive', location: 'Best time for predator activity' }
          ]
        },
        previous: [
          { day: 1, date: 'Saturday, March 15', summary: 'Arrival' },
          { day: 2, date: 'Sunday, March 16', summary: 'Transfer to Mara' }
        ]
      }
    }
  }

  const currentBooking = selectedBooking ? bookingDetails[selectedBooking] : null

  const closeBookingDetail = () => {
    setSelectedBooking(null)
    document.body.style.overflow = 'auto'
  }

  const openBookingDetail = (code: string) => {
    setSelectedBooking(code)
    document.body.style.overflow = 'hidden'
  }

  // Handle Escape key
  useEffect(() => {
    if (!selectedBooking) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeBookingDetail()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [selectedBooking])

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1>Bookings</h1>
              <p className="text-secondary mt-1">Manage all travel bookings</p>
            </div>
            <Link href="/v2/dmc/ai-assistant" className="btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Booking
            </Link>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="card p-4 mb-6 flex items-center gap-4">
          <div className="flex-1">
            <input type="text" placeholder="Search bookings..." className="input-field w-full" />
          </div>
          <select className="input-field">
            <option>All Status</option>
            <option>Active</option>
            <option>Upcoming</option>
            <option>Completed</option>
            <option>Draft</option>
          </select>
          <select className="input-field">
            <option>All Dates</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Next Month</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default bg-subtle">
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Booking</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Traveler</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Trip</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Dates</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {bookings.map((booking) => (
                <tr key={booking.code} className="table-row cursor-pointer" onClick={() => openBookingDetail(booking.code)}>
                  <td className="px-5 py-4">
                    <span className="font-mono font-medium">{booking.code}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-subtle rounded-full flex items-center justify-center text-xs font-medium">
                        {getInitials(booking.traveler)}
                      </div>
                      <div>
                        <div className="font-medium">{booking.traveler}</div>
                        <div className="text-sm text-tertiary">{booking.travelerCount} travelers</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium">{booking.trip}</div>
                    <div className="text-sm text-tertiary">{booking.route}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div>{booking.dates}</div>
                    <div className="text-sm text-tertiary">{booking.nights} nights</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.statusText}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono font-medium">{booking.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Slideover */}
      {selectedBooking && currentBooking && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeBookingDetail}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl slide-panel overflow-auto">
            <div className="sticky top-0 bg-white border-b border-default px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl font-semibold">{currentBooking.code}</span>
                  <span className={`badge ${getStatusBadge(currentBooking.status)}`}>
                    {currentBooking.statusText}
                  </span>
                </div>
                <p className="text-sm text-secondary mt-1">{currentBooking.trip}</p>
              </div>
              <button onClick={closeBookingDetail} className="p-2 hover:bg-subtle rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  {/* Today */}
                  <div className="card overflow-hidden border-2 border-black">
                    <div className="px-4 py-3 bg-black text-white flex items-center justify-between">
                      <span className="font-medium">
                        Day {currentBooking.itinerary.today.day} — {currentBooking.itinerary.today.date}
                      </span>
                      <span className="text-sm opacity-70">Today</span>
                    </div>
                    <div className="p-4 space-y-4">
                      {currentBooking.itinerary.today.activities.map((activity: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <span className="text-tertiary text-sm w-12 font-mono">{activity.time}</span>
                          <div className="w-8 h-8 bg-subtle rounded-lg flex items-center justify-center">
                            {activity.icon}
                          </div>
                          <div>
                            <div className="font-medium">{activity.title}</div>
                            <div className="text-sm text-secondary">{activity.location}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Previous Days */}
                  <div className="card">
                    {currentBooking.itinerary.previous.map((day: any, idx: number) => (
                      <div key={idx} className={`px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-subtle ${
                        idx < currentBooking.itinerary.previous.length - 1 ? 'border-b border-default' : ''
                      }`}>
                        <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">
                          Day {day.day} — {day.date}
                        </span>
                        <span className="ml-auto text-sm text-tertiary">{day.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Travelers */}
                  <div className="card p-4">
                    <h4 className="font-medium mb-3" style={{ fontFamily: "'Geist', sans-serif" }}>Travelers</h4>
                    <div className="space-y-3">
                      {currentBooking.travelers.map((traveler: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-subtle rounded-full flex items-center justify-center text-xs">
                            {traveler.initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{traveler.name}</div>
                            <div className="text-xs text-tertiary">{traveler.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return Flight */}
                  <div className="card p-4">
                    <h4 className="font-medium mb-3" style={{ fontFamily: "'Geist', sans-serif" }}>Return Flight</h4>
                    <div className="text-sm">
                      <div className="font-mono">
                        {currentBooking.returnFlight.code} · {currentBooking.returnFlight.date}
                      </div>
                      <div className="text-secondary">{currentBooking.returnFlight.route}</div>
                      <div className="text-secondary">{currentBooking.returnFlight.departure}</div>
                      <span className="badge badge-alert mt-2">
                        Delayed {currentBooking.returnFlight.delay}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button className="w-full btn-primary px-4 py-2.5 rounded-lg text-sm">Send Message</button>
                    <button className="w-full btn-secondary px-4 py-2.5 rounded-lg text-sm">Resend Itinerary</button>
                    <button className="w-full btn-secondary px-4 py-2.5 rounded-lg text-sm">Edit Booking</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

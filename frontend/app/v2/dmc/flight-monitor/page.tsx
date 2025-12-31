'use client'

import { Plane, Clock, MapPin } from 'lucide-react'

export default function FlightMonitorPage() {
  const flights = [
    {
      code: 'UA234',
      traveler: 'Sarah Chen',
      bookingCode: 'BK-2025-XJ8K9P',
      route: 'SFO → NRT',
      departure: '14:30',
      arrival: '17:45+1',
      status: 'delayed',
      delay: '2 hours',
      gate: 'G12'
    },
    {
      code: 'AF456',
      traveler: 'Robert Kim',
      bookingCode: 'BK-2025-M3N4P5',
      route: 'LAX → CDG',
      departure: '18:45',
      arrival: '14:15+1',
      status: 'on-time',
      gate: 'B8'
    },
    {
      code: 'BA789',
      traveler: 'Emily Davis',
      bookingCode: 'BK-2025-P7Q8R9',
      route: 'LHR → DPS',
      departure: '21:15',
      arrival: '18:30+1',
      status: 'on-time',
      gate: 'A15'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Plane size={28} />
            <h1 className="text-3xl">Flight Monitor</h1>
          </div>
          <p className="text-secondary">Real-time flight tracking for all active bookings</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="space-y-4">
          {flights.map((flight) => (
            <div key={flight.code} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{flight.code}</h3>
                    <span
                      className={`badge ${
                        flight.status === 'delayed' ? 'badge-alert' : 'badge-active'
                      }`}
                    >
                      {flight.status}
                    </span>
                    {flight.delay && (
                      <span className="text-sm text-secondary">+{flight.delay}</span>
                    )}
                  </div>
                  <div className="text-sm text-secondary mb-1">{flight.traveler}</div>
                  <div className="text-xs text-tertiary font-mono">{flight.bookingCode}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-tertiary mb-1">Gate</div>
                  <div className="text-2xl font-semibold">{flight.gate}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm text-tertiary mb-1">Departure</div>
                      <div className="text-2xl font-semibold font-mono">{flight.departure}</div>
                    </div>
                    <div className="flex items-center gap-2 text-secondary">
                      <div className="h-px flex-1 w-24 bg-border"></div>
                      <Plane size={18} />
                      <div className="h-px flex-1 w-24 bg-border"></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-tertiary mb-1">Arrival</div>
                      <div className="text-2xl font-semibold font-mono">{flight.arrival}</div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-secondary">{flight.route}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

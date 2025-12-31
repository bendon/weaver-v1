'use client'

import { Search, Filter, Download, MoreVertical } from 'lucide-react'
import { useState } from 'react'

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState('all')

  const bookings = [
    {
      code: 'BK-2025-XJ8K9P',
      traveler: 'Sarah Chen',
      destination: 'Tokyo, Japan',
      dates: 'Mar 15-22, 2025',
      status: 'confirmed',
      value: '$8,450',
      payment: 'paid'
    },
    {
      code: 'BK-2025-L9M2N4',
      traveler: 'Michael Brown',
      destination: 'Paris, France',
      dates: 'Mar 18-25, 2025',
      status: 'confirmed',
      value: '$12,300',
      payment: 'paid'
    },
    {
      code: 'BK-2025-P7Q8R9',
      traveler: 'Emily Davis',
      destination: 'Bali, Indonesia',
      dates: 'Mar 20-30, 2025',
      status: 'pending',
      value: '$6,750',
      payment: 'deposit'
    },
    {
      code: 'BK-2025-M3N4P5',
      traveler: 'Robert Kim',
      destination: 'London, UK',
      dates: 'Mar 12-19, 2025',
      status: 'in-progress',
      value: '$9,200',
      payment: 'paid'
    },
    {
      code: 'BK-2025-Q6R7S8',
      traveler: 'Jessica Wilson',
      destination: 'Dubai, UAE',
      dates: 'Apr 5-12, 2025',
      status: 'draft',
      value: '$15,800',
      payment: 'pending'
    },
    {
      code: 'BK-2025-T9U1V2',
      traveler: 'David Martinez',
      destination: 'Barcelona, Spain',
      dates: 'Apr 10-17, 2025',
      status: 'confirmed',
      value: '$7,900',
      payment: 'deposit'
    },
    {
      code: 'BK-2025-W3X4Y5',
      traveler: 'Amanda Lee',
      destination: 'Santorini, Greece',
      dates: 'May 1-8, 2025',
      status: 'draft',
      value: '$10,500',
      payment: 'pending'
    },
    {
      code: 'BK-2025-Z6A7B8',
      traveler: 'Chris Taylor',
      destination: 'Rome, Italy',
      dates: 'Feb 28-Mar 7, 2025',
      status: 'completed',
      value: '$11,200',
      payment: 'paid'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      'confirmed': 'badge-active',
      'in-progress': 'badge-alert',
      'pending': 'badge-upcoming',
      'draft': 'badge-draft',
      'completed': 'badge-completed'
    }
    return badges[status as keyof typeof badges] || 'badge-draft'
  }

  const getPaymentBadge = (payment: string) => {
    const badges = {
      'paid': 'badge-completed',
      'deposit': 'badge-active',
      'pending': 'badge-draft'
    }
    return badges[payment as keyof typeof badges] || 'badge-draft'
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-1">Bookings</h1>
              <p className="text-secondary">Manage all trip bookings and reservations</p>
            </div>
            <button className="btn-primary px-6 py-2.5 rounded-lg font-medium">
              + New Booking
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Search by booking code, traveler, or destination..."
                className="input-field w-full pl-10"
              />
            </div>
            <button className="btn-secondary px-4 py-2.5 rounded-lg flex items-center gap-2">
              <Filter size={16} />
              <span>Filters</span>
            </button>
            <button className="btn-secondary px-4 py-2.5 rounded-lg flex items-center gap-2">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-default -mb-px">
            {['all', 'confirmed', 'in-progress', 'pending', 'draft', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'border-b-2 border-black'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-subtle border-b border-default">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Booking Code
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Traveler
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Destination
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Dates
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Value
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase tracking-wider">
                  Payment
                </th>
                <th className="w-12 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking) => (
                <tr key={booking.code} className="table-row">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium">{booking.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{booking.traveler}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-secondary">{booking.destination}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-secondary">{booking.dates}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">{booking.value}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getPaymentBadge(booking.payment)}`}>
                      {booking.payment}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-tertiary hover:text-primary">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-secondary">
            Showing <span className="font-medium">1-8</span> of <span className="font-medium">47</span> bookings
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-3 py-2 rounded text-sm">Previous</button>
            <button className="btn-primary px-3 py-2 rounded text-sm">1</button>
            <button className="btn-secondary px-3 py-2 rounded text-sm">2</button>
            <button className="btn-secondary px-3 py-2 rounded text-sm">3</button>
            <button className="btn-secondary px-3 py-2 rounded text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

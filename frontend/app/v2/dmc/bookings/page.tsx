'use client'

import { useState } from 'react'
import { Search, Filter, Plus } from 'lucide-react'
import { useBookings, Booking } from '@/v2/hooks/useBookings'
import Link from 'next/link'

export default function BookingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)

  const { bookings, loading, error, pagination } = useBookings({
    page,
    per_page: 20,
    status: statusFilter || undefined,
    search: searchQuery || undefined
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1) // Reset to first page on search
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status)
    setPage(1) // Reset to first page on filter change
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'confirmed': 'badge-active',
      'in_progress': 'badge-alert',
      'pending': 'badge-upcoming',
      'draft': 'badge-draft',
      'completed': 'badge-completed',
      'cancelled': 'badge-cancelled'
    }
    return badges[status] || 'badge-draft'
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    return `${formatDate(startDate)} – ${formatDate(endDate)}`
  }

  const statusOptions = [
    { value: '', label: 'All' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'draft', label: 'Draft' },
    { value: 'completed', label: 'Completed' }
  ]

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1>Bookings</h1>
              <p className="text-secondary mt-1">Manage all trip bookings and reservations</p>
            </div>
            <Link href="/v2/dmc/bookings/new" className="btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <Plus size={16} />
              New Booking
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Search by booking code, traveler, or destination..."
                className="input-field w-full pl-10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <button className="btn-secondary px-4 py-2.5 rounded-lg flex items-center gap-2">
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-6 mt-6 border-b border-default -mb-px">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusFilter(option.value)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  (statusFilter === option.value) || (!statusFilter && option.value === '')
                    ? 'border-b-2 border-black text-primary'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Loading State */}
        {loading && (
          <div className="card p-8 text-center">
            <div className="animate-pulse text-secondary">Loading bookings...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="card p-6 border-l-2 border-l-black bg-subtle">
            <p className="text-sm text-secondary">{error}</p>
            <p className="text-xs text-tertiary mt-2">Make sure MongoDB is running and you're authenticated</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && bookings.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-secondary mb-2">No bookings found</div>
            <p className="text-sm text-tertiary">
              {searchQuery || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Create your first booking to get started'}
            </p>
            {!searchQuery && !statusFilter && (
              <Link href="/v2/dmc/bookings/new" className="btn-primary px-6 py-2.5 rounded-lg text-sm mt-4 inline-flex items-center gap-2">
                <Plus size={16} />
                Create Booking
              </Link>
            )}
          </div>
        )}

        {/* Bookings Grid */}
        {!loading && !error && bookings.length > 0 && (
          <>
            <div className="grid gap-4">
              {bookings.map((booking: Booking) => (
                <Link
                  key={booking.id}
                  href={`/v2/dmc/bookings/${booking.id}`}
                  className="card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Booking Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-mono text-sm font-medium">{booking.booking_code}</span>
                        <span className={`badge ${getStatusBadge(booking.status)}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="mb-2">
                        <h3 className="text-base font-medium mb-1">{booking.trip.destination}</h3>
                        {booking.traveler && (
                          <p className="text-sm text-secondary">{booking.traveler.name}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-tertiary">
                        <span>{formatDateRange(booking.trip.start_date, booking.trip.end_date)}</span>
                        <span>•</span>
                        <span>{booking.trip.duration_days} days</span>
                      </div>
                    </div>

                    {/* Right: Pricing */}
                    <div className="text-right">
                      <div className="text-lg font-semibold mb-1">
                        {formatCurrency(booking.pricing.total, booking.pricing.currency)}
                      </div>
                      <div className="text-xs text-tertiary">
                        {booking.payment.status === 'paid' ? 'Paid in full' :
                         booking.payment.status === 'partial' ? 'Deposit paid' :
                         'Payment pending'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-secondary">
                  Showing <span className="font-medium">{((page - 1) * pagination.per_page) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.per_page, pagination.total_items)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total_items}</span> bookings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.has_prev}
                    className="btn-secondary px-3 py-2 rounded text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded text-sm ${
                          page === pageNum ? 'btn-primary' : 'btn-secondary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.has_next}
                    className="btn-secondary px-3 py-2 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

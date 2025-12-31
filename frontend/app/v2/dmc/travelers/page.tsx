'use client'

import { useState } from 'react'
import { Search, Filter, Plus, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { useTravelers, Traveler } from '@/v2/hooks/useTravelers'
import Link from 'next/link'

export default function TravelersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  const { travelers, loading, error, pagination } = useTravelers({
    page,
    per_page: 20,
    search: searchQuery || undefined
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1) // Reset to first page on search
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-white border-b border-default">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1>Travelers</h1>
              <p className="text-secondary mt-1">Manage traveler profiles and preferences</p>
            </div>
            <Link href="/v2/dmc/travelers/new" className="btn-primary px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
              <Plus size={16} />
              Add Traveler
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
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
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Loading State */}
        {loading && (
          <div className="card p-8 text-center">
            <div className="animate-pulse text-secondary">Loading travelers...</div>
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
        {!loading && !error && travelers.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-secondary mb-2">No travelers found</div>
            <p className="text-sm text-tertiary">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Add your first traveler to get started'}
            </p>
            {!searchQuery && (
              <Link href="/v2/dmc/travelers/new" className="btn-primary px-6 py-2.5 rounded-lg text-sm mt-4 inline-flex items-center gap-2">
                <Plus size={16} />
                Add Traveler
              </Link>
            )}
          </div>
        )}

        {/* Travelers Grid */}
        {!loading && !error && travelers.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-6">
              {travelers.map((traveler: Traveler) => (
                <Link
                  key={traveler.id}
                  href={`/v2/dmc/travelers/${traveler.id}`}
                  className="card p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-base font-medium">
                        {traveler.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-0.5">{traveler.name}</h3>
                        {traveler.tags && traveler.tags.includes('vip') && (
                          <span className="badge badge-alert text-xs">VIP</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-default">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Mail size={14} />
                      <span className="truncate">{traveler.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <Phone size={14} />
                      <span>{traveler.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary">
                      <MapPin size={14} />
                      <span>{traveler.nationality}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-tertiary mb-1">Total Bookings</div>
                      <div className="text-lg font-semibold">{traveler.total_bookings}</div>
                    </div>
                    <div>
                      <div className="text-xs text-tertiary mb-1">Total Spent</div>
                      <div className="text-lg font-semibold">{formatCurrency(traveler.total_spent)}</div>
                    </div>
                  </div>

                  {/* Last Trip */}
                  {traveler.travel_history && traveler.travel_history.length > 0 && (
                    <div className="pt-4 border-t border-default">
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-tertiary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-tertiary mb-0.5">Last Trip</div>
                          <div className="text-sm font-medium truncate">
                            {traveler.travel_history[0].destination}
                          </div>
                          <div className="text-xs text-secondary">
                            {traveler.travel_history[0].dates}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-secondary">
                  Showing <span className="font-medium">{((page - 1) * pagination.per_page) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.per_page, pagination.total_items)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total_items}</span> travelers
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

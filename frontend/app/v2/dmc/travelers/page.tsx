'use client'

import { Search, Filter, Download, Mail, Phone, MapPin, Calendar } from 'lucide-react'

export default function TravelersPage() {
  const travelers = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      nationality: 'United States',
      totalBookings: 8,
      totalSpent: 42500,
      lastTrip: 'Tokyo, Japan',
      lastTripDate: 'Mar 2025',
      status: 'vip'
    },
    {
      name: 'Michael Brown',
      email: 'michael.b@email.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      nationality: 'United States',
      totalBookings: 5,
      totalSpent: 28300,
      lastTrip: 'Paris, France',
      lastTripDate: 'Feb 2025',
      status: 'active'
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+44 20 1234 5678',
      location: 'London, UK',
      nationality: 'United Kingdom',
      totalBookings: 12,
      totalSpent: 67800,
      lastTrip: 'Bali, Indonesia',
      lastTripDate: 'Jan 2025',
      status: 'vip'
    },
    {
      name: 'Robert Kim',
      email: 'robert.kim@email.com',
      phone: '+1 (555) 345-6789',
      location: 'Los Angeles, CA',
      nationality: 'United States',
      totalBookings: 3,
      totalSpent: 15200,
      lastTrip: 'London, UK',
      lastTripDate: 'Mar 2025',
      status: 'active'
    },
    {
      name: 'Jessica Wilson',
      email: 'jessica.w@email.com',
      phone: '+1 (555) 456-7890',
      location: 'Chicago, IL',
      nationality: 'United States',
      totalBookings: 6,
      totalSpent: 34500,
      lastTrip: 'Dubai, UAE',
      lastTripDate: 'Dec 2024',
      status: 'active'
    },
    {
      name: 'David Martinez',
      email: 'david.m@email.com',
      phone: '+34 91 123 4567',
      location: 'Madrid, Spain',
      nationality: 'Spain',
      totalBookings: 4,
      totalSpent: 22100,
      lastTrip: 'Barcelona, Spain',
      lastTripDate: 'Nov 2024',
      status: 'active'
    },
    {
      name: 'Amanda Lee',
      email: 'amanda.lee@email.com',
      phone: '+1 (555) 567-8901',
      location: 'Seattle, WA',
      nationality: 'United States',
      totalBookings: 2,
      totalSpent: 12800,
      lastTrip: 'Santorini, Greece',
      lastTripDate: 'Sep 2024',
      status: 'new'
    },
    {
      name: 'Chris Taylor',
      email: 'chris.taylor@email.com',
      phone: '+1 (555) 678-9012',
      location: 'Boston, MA',
      nationality: 'United States',
      totalBookings: 7,
      totalSpent: 39600,
      lastTrip: 'Rome, Italy',
      lastTripDate: 'Feb 2025',
      status: 'active'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-1">Travelers</h1>
              <p className="text-secondary">Manage traveler profiles and preferences</p>
            </div>
            <button className="btn-primary px-6 py-2.5 rounded-lg font-medium">
              + Add Traveler
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or location..."
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
        </div>
      </div>

      {/* Grid */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-3 gap-6">
          {travelers.map((traveler) => (
            <div key={traveler.email} className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center text-base font-medium">
                    {traveler.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-0.5">{traveler.name}</h3>
                    {traveler.status === 'vip' && (
                      <span className="badge badge-alert text-xs">VIP</span>
                    )}
                    {traveler.status === 'new' && (
                      <span className="badge badge-active text-xs">New</span>
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
                  <span>{traveler.location}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-tertiary mb-1">Total Bookings</div>
                  <div className="text-lg font-semibold">{traveler.totalBookings}</div>
                </div>
                <div>
                  <div className="text-xs text-tertiary mb-1">Total Spent</div>
                  <div className="text-lg font-semibold">{formatCurrency(traveler.totalSpent)}</div>
                </div>
              </div>

              {/* Last Trip */}
              <div className="pt-4 border-t border-default">
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-tertiary mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-tertiary mb-0.5">Last Trip</div>
                    <div className="text-sm font-medium truncate">{traveler.lastTrip}</div>
                    <div className="text-xs text-secondary">{traveler.lastTripDate}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-secondary">
            Showing <span className="font-medium">1-8</span> of <span className="font-medium">127</span> travelers
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

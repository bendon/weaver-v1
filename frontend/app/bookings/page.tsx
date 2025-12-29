'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Table, Grid, Calendar } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { SkeletonBookingCard, SkeletonTable } from '@/components/Skeleton';
import './bookings.css';

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter, search],
    queryFn: async () => {
      const result = await api.getBookings(statusFilter === 'all' ? undefined : statusFilter);
      // Filter by search if provided
      if (search) {
        const filtered = result.bookings.filter((b: any) => {
          const code = (b.booking_code || b.code || '').toLowerCase();
          const title = (b.title || '').toLowerCase();
          const traveler = b.travelers?.[0] 
            ? `${b.travelers[0].first_name || ''} ${b.travelers[0].last_name || ''}`.toLowerCase()
            : '';
          const searchLower = search.toLowerCase();
          return code.includes(searchLower) || title.includes(searchLower) || traveler.includes(searchLower);
        });
        return { bookings: filtered, total: filtered.length };
      }
      return result;
    },
  });

  const bookings = data?.bookings || [];

  const handleBookingClick = (id: string) => {
    router.push(`/bookings/${id}`);
  };

  return (
    <DashboardLayout
      title="Bookings"
      actions={
        <button
          className="btn-primary"
          onClick={() => router.push('/bookings/new')}
        >
          <Plus size={20} />
          New Booking
        </button>
      }
    >
      <div className="bookings-page">
        {/* Filters */}
        <div className="bookings-filters">
          <div className="bookings-search">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by code, traveler, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bookings-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="bookings-view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              <Table size={20} />
            </button>
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          viewMode === 'table' ? (
            <div className="bookings-table-container">
              <SkeletonTable rows={8} columns={7} />
            </div>
          ) : (
            <div className="bookings-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonBookingCard key={i} />
              ))}
            </div>
          )
        ) : bookings.length === 0 ? (
          <div className="bookings-empty">
            <Calendar size={48} />
            <h3>No bookings yet</h3>
            <p>Create your first booking to get started</p>
            <button className="btn-primary" onClick={() => router.push('/bookings/new')}>
              Create Booking
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bookings-table-container">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking Code</th>
                  <th>Traveler</th>
                  <th>Trip</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking: any) => {
                  const traveler = booking.travelers?.[0] || booking.traveler;
                  const travelerName = traveler
                    ? `${traveler.first_name || ''} ${traveler.last_name || ''}`.trim()
                    : `${booking.total_travelers || 1} Traveler${(booking.total_travelers || 1) > 1 ? 's' : ''}`;
                  
                  return (
                    <tr key={booking.id || booking.booking_id} onClick={() => handleBookingClick(booking.id || booking.booking_id)}>
                      <td>
                        <code className="booking-code">{booking.booking_code || booking.code || booking.id}</code>
                      </td>
                      <td>{travelerName}</td>
                      <td>{booking.title || 'Untitled Trip'}</td>
                      <td>
                        {booking.start_date && booking.end_date ? (
                          <>
                            {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                          </>
                        ) : (
                          'TBD'
                        )}
                      </td>
                      <td>
                        <span className={`status-badge status-${booking.status || 'draft'}`}>
                          {booking.status || 'draft'}
                        </span>
                      </td>
                      <td>
                        {booking.total_price 
                          ? `${booking.currency || 'USD'} ${booking.total_price.toLocaleString()}`
                          : '—'
                        }
                      </td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookingClick(booking.id || booking.booking_id);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking: any) => {
              const traveler = booking.travelers?.[0] || booking.traveler;
              const travelerName = traveler
                ? `${traveler.first_name || ''} ${traveler.last_name || ''}`.trim()
                : 'Unknown';
              
              return (
                <div
                  key={booking.id || booking.booking_id}
                  className="booking-card"
                  onClick={() => handleBookingClick(booking.id || booking.booking_id)}
                >
                  <div className="booking-card-header">
                    <code className="booking-code">{booking.booking_code || booking.code || booking.id}</code>
                    <span className={`status-badge status-${booking.status || 'draft'}`}>
                      {booking.status || 'draft'}
                    </span>
                  </div>
                  <h3 className="booking-card-title">{booking.title || 'Untitled Trip'}</h3>
                  <p className="booking-card-traveler">{travelerName}</p>
                  {booking.start_date && booking.end_date && (
                    <p className="booking-card-dates">
                      {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                    </p>
                  )}
                  {booking.total_price && (
                    <p className="booking-card-price">
                      {booking.currency || 'USD'} {booking.total_price.toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingsPageContent />
    </Suspense>
  );
}


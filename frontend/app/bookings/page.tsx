'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Table, Grid, Calendar, Users, Plane, Hotel, Activity, Clock, Edit, Eye, Send, Mail, Phone } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { format, differenceInDays } from 'date-fns';
import { SkeletonBookingCard, SkeletonTable } from '@/components/Skeleton';
import './bookings.css';

function BookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const travelerCellRef = useRef<HTMLTableCellElement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter, search],
    queryFn: async () => {
      const result = await api.getBookings(statusFilter === 'all' ? undefined : statusFilter);
      
      // Enrich bookings with additional details
      const enrichedBookings = await Promise.all(
        result.bookings.map(async (booking: any) => {
          try {
            const [travelersData, flightsData, hotelsData, activitiesData] = await Promise.all([
              api.getBookingTravelers(booking.id || booking.booking_id).catch(() => ({ travelers: [], total: 0 })),
              api.getBookingFlights(booking.id || booking.booking_id).catch(() => ({ flights: [], total: 0 })),
              api.getBookingHotels(booking.id || booking.booking_id).catch(() => ({ hotels: [], total: 0 })),
              api.getBookingActivities(booking.id || booking.booking_id).catch(() => ({ activities: [], total: 0 })),
            ]);
            
            return {
              ...booking,
              travelers_count: travelersData.travelers?.length || 0,
              flights_count: flightsData.flights?.length || 0,
              hotels_count: hotelsData.hotels?.length || 0,
              activities_count: activitiesData.activities?.length || 0,
              days_until_departure: booking.start_date 
                ? differenceInDays(new Date(booking.start_date), new Date())
                : null,
            };
          } catch (error) {
            // If enrichment fails, return booking with default values
            return {
              ...booking,
              travelers_count: 0,
              flights_count: 0,
              hotels_count: 0,
              activities_count: 0,
              days_until_departure: null,
            };
          }
        })
      );
      
      // Filter by search if provided
      if (search) {
        const filtered = enrichedBookings.filter((b: any) => {
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
      
      return { bookings: enrichedBookings, total: enrichedBookings.length };
    },
  });

  const bookings = data?.bookings || [];

  // Fetch travelers for hovered booking
  const { data: hoveredTravelersData } = useQuery({
    queryKey: ['booking-travelers', hoveredBookingId],
    queryFn: () => api.getBookingTravelers(hoveredBookingId!),
    enabled: !!hoveredBookingId,
  });

  const hoveredTravelers = hoveredTravelersData?.travelers || [];

  const handleBookingClick = (id: string) => {
    router.push(`/bookings/${id}`);
  };

  const handleEditClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/bookings/${id}/edit`);
  };

  const handleSendClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/bookings/${id}/send`);
  };

  const handleTravelerCellMouseEnter = (e: React.MouseEvent<HTMLTableCellElement>, bookingId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    const cell = e.currentTarget;
    const rect = cell.getBoundingClientRect();
    
    // Position popover to the right of the cell, or left if near right edge
    const popoverWidth = 280;
    const popoverHeight = 200; // Estimated height
    const spaceOnRight = window.innerWidth - rect.right;
    const spaceOnLeft = rect.left;
    const spaceOnBottom = window.innerHeight - rect.bottom;
    
    let left = rect.right + 10;
    let top = rect.top + window.scrollY;
    
    // Adjust horizontal position if needed
    if (spaceOnRight < popoverWidth && spaceOnLeft > popoverWidth) {
      left = rect.left - popoverWidth - 10;
    } else if (spaceOnRight < popoverWidth) {
      // If both sides are tight, position to the right but adjust
      left = window.innerWidth - popoverWidth - 10;
    }
    
    // Adjust vertical position if near bottom
    if (spaceOnBottom < popoverHeight && rect.top > popoverHeight) {
      top = rect.bottom + window.scrollY - popoverHeight;
    }
    
    setPopoverPosition({
      top: top,
      left: left + window.scrollX,
    });
    
    setHoveredBookingId(bookingId);
    travelerCellRef.current = cell;
  };

  const handleTravelerCellMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredBookingId(null);
    }, 200); // Small delay to allow moving to popover
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handlePopoverMouseLeave = () => {
    setHoveredBookingId(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
                  <th>Details</th>
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
                    : `${booking.total_travelers || booking.travelers_count || 1} Traveler${(booking.total_travelers || booking.travelers_count || 1) > 1 ? 's' : ''}`;
                  
                  const daysUntil = booking.days_until_departure;
                  const isUpcoming = daysUntil !== null && daysUntil >= 0;
                  
                  return (
                    <tr key={booking.id || booking.booking_id} onClick={() => handleBookingClick(booking.id || booking.booking_id)}>
                      <td>
                        <code className="booking-code">{booking.booking_code || booking.code || booking.id}</code>
                      </td>
                      <td
                        ref={booking.id === hoveredBookingId ? travelerCellRef : null}
                        className="booking-traveler-cell-wrapper"
                        onMouseEnter={(e) => handleTravelerCellMouseEnter(e, booking.id || booking.booking_id)}
                        onMouseLeave={handleTravelerCellMouseLeave}
                      >
                        <div className="booking-traveler-cell">
                          <strong>{travelerName}</strong>
                          {booking.travelers_count > 1 && (
                            <span className="booking-count-badge">
                              <Users size={12} />
                              {booking.travelers_count}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="booking-title-cell">
                          <strong>{booking.title || 'Untitled Trip'}</strong>
                          {booking.notes && (
                            <span className="booking-notes-preview" title={booking.notes}>
                              {booking.notes.length > 50 ? booking.notes.substring(0, 50) + '...' : booking.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="booking-dates-cell">
                          {booking.start_date && booking.end_date ? (
                            <>
                              <div>{format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}</div>
                              {isUpcoming && (
                                <div className="booking-days-until">
                                  <Clock size={12} />
                                  {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                                </div>
                              )}
                            </>
                          ) : (
                            'TBD'
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="booking-details-cell">
                          <div className="booking-detail-item">
                            <Plane size={14} />
                            <span>{booking.flights_count || 0}</span>
                          </div>
                          <div className="booking-detail-item">
                            <Hotel size={14} />
                            <span>{booking.hotels_count || 0}</span>
                          </div>
                          <div className="booking-detail-item">
                            <Activity size={14} />
                            <span>{booking.activities_count || 0}</span>
                          </div>
                        </div>
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
                        <div className="booking-actions-cell">
                          <button
                            className="btn-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookingClick(booking.id || booking.booking_id);
                            }}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={(e) => handleEditClick(e, booking.id || booking.booking_id)}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={(e) => handleSendClick(e, booking.id || booking.booking_id)}
                            title="Send to Traveler"
                          >
                            <Send size={16} />
                          </button>
                        </div>
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
                : `${booking.total_travelers || booking.travelers_count || 1} Traveler${(booking.total_travelers || booking.travelers_count || 1) > 1 ? 's' : ''}`;
              
              const daysUntil = booking.days_until_departure;
              const isUpcoming = daysUntil !== null && daysUntil >= 0;
              
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
                  <div
                    className="booking-card-traveler"
                    onMouseEnter={(e) => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const popoverWidth = 280;
                      const popoverHeight = 200;
                      const spaceOnRight = window.innerWidth - rect.right;
                      const spaceOnBottom = window.innerHeight - rect.bottom;
                      
                      let left = rect.left + window.scrollX;
                      let top = rect.bottom + window.scrollY + 5;
                      
                      // Adjust if near right edge
                      if (spaceOnRight < popoverWidth) {
                        left = rect.right + window.scrollX - popoverWidth;
                      }
                      
                      // Adjust if near bottom
                      if (spaceOnBottom < popoverHeight && rect.top > popoverHeight) {
                        top = rect.top + window.scrollY - popoverHeight - 5;
                      }
                      
                      setPopoverPosition({ top, left });
                      setHoveredBookingId(booking.id || booking.booking_id);
                    }}
                    onMouseLeave={handleTravelerCellMouseLeave}
                  >
                    <Users size={14} />
                    <span>{travelerName}</span>
                    {booking.travelers_count > 1 && (
                      <span className="booking-count-badge">{booking.travelers_count}</span>
                    )}
                  </div>
                  {booking.start_date && booking.end_date && (
                    <div className="booking-card-dates">
                      <Calendar size={14} />
                      <span>
                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                      </span>
                      {isUpcoming && (
                        <span className="booking-days-until">
                          <Clock size={12} />
                          {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="booking-card-details">
                    <div className="booking-detail-item">
                      <Plane size={14} />
                      <span>{booking.flights_count || 0} flight{booking.flights_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="booking-detail-item">
                      <Hotel size={14} />
                      <span>{booking.hotels_count || 0} hotel{booking.hotels_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="booking-detail-item">
                      <Activity size={14} />
                      <span>{booking.activities_count || 0} activit{booking.activities_count !== 1 ? 'ies' : 'y'}</span>
                    </div>
                  </div>
                  {booking.total_price && (
                    <p className="booking-card-price">
                      {booking.currency || 'USD'} {booking.total_price.toLocaleString()}
                    </p>
                  )}
                  <div className="booking-card-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookingClick(booking.id || booking.booking_id);
                      }}
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => handleEditClick(e, booking.id || booking.booking_id)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => handleSendClick(e, booking.id || booking.booking_id)}
                      title="Send"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Travelers Popover */}
        {hoveredBookingId && hoveredTravelers.length > 0 && (
          <div
            className="travelers-popover"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <div className="travelers-popover-header">
              <Users size={16} />
              <span>Travelers ({hoveredTravelers.length})</span>
            </div>
            <div className="travelers-popover-list">
              {hoveredTravelers.map((traveler: any, idx: number) => (
                <div key={traveler.id || traveler.traveler_id || idx} className="travelers-popover-item">
                  <div className="traveler-popover-avatar">
                    {(traveler.first_name?.charAt(0) || 'T').toUpperCase()}
                  </div>
                  <div className="traveler-popover-info">
                    <div className="traveler-popover-name">
                      {traveler.first_name} {traveler.last_name}
                    </div>
                    {traveler.email && (
                      <div className="traveler-popover-contact">
                        <Mail size={12} />
                        {traveler.email}
                      </div>
                    )}
                    {traveler.phone && (
                      <div className="traveler-popover-contact">
                        <Phone size={12} />
                        {traveler.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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


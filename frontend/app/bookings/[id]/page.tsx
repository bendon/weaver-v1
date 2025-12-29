'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Copy, Send, Download, Trash2, Calendar, Users, Plane, MessageSquare, Activity } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { Skeleton, SkeletonCard, SkeletonText } from '@/components/Skeleton';
import '../bookings.css';
import './booking-detail.css';

type Tab = 'overview' | 'itinerary' | 'travelers' | 'flights' | 'messages' | 'activity';

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');

  // Fetch booking data
  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  // Fetch travelers
  const { data: travelersData, isLoading: travelersLoading } = useQuery({
    queryKey: ['booking-travelers', bookingId],
    queryFn: () => api.getBookingTravelers(bookingId),
    enabled: !!bookingId,
  });

  // Fetch flights
  const { data: flightsData, isLoading: flightsLoading } = useQuery({
    queryKey: ['booking-flights', bookingId],
    queryFn: () => api.getBookingFlights(bookingId),
    enabled: !!bookingId,
  });

  // Fetch hotels
  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ['booking-hotels', bookingId],
    queryFn: () => api.getBookingHotels(bookingId),
    enabled: !!bookingId,
  });

  // Fetch transfers
  const { data: transfersData, isLoading: transfersLoading } = useQuery({
    queryKey: ['booking-transfers', bookingId],
    queryFn: () => api.getBookingTransfers(bookingId),
    enabled: !!bookingId,
  });

  // Fetch activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['booking-activities', bookingId],
    queryFn: () => api.getBookingActivities(bookingId),
    enabled: !!bookingId,
  });

  // Fetch messages
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: () => api.getBookingMessages(bookingId),
    enabled: !!bookingId,
  });

  const travelers = travelersData?.travelers || [];
  const flights = flightsData?.flights || [];
  const hotels = hotelsData?.hotels || [];
  const transfers = transfersData?.transfers || [];
  const activities = activitiesData?.activities || [];
  const messages = messagesData?.messages || [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <Skeleton width="200px" height="2rem" />
            <Skeleton width="120px" height="1rem" style={{ marginTop: '0.5rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i}>
                <Skeleton width="80px" height="1rem" />
                <Skeleton width="60px" height="2rem" style={{ marginTop: '0.5rem' }} />
              </SkeletonCard>
            ))}
          </div>
          <SkeletonCard>
            <SkeletonText lines={5} />
          </SkeletonCard>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Booking not found</h2>
          <button onClick={() => router.push('/bookings')}>Back to Bookings</button>
        </div>
      </DashboardLayout>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.booking_code || booking.code || bookingId);
  };

  return (
    <DashboardLayout
      title={booking.title || 'Booking Details'}
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: booking.booking_code || bookingId },
      ]}
      actions={
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => router.push(`/bookings/${bookingId}/edit`)}>
            <Edit size={16} />
            Edit
          </button>
          <button className="btn-secondary" onClick={handleCopyCode}>
            <Copy size={16} />
            Copy Code
          </button>
          <button className="btn-primary" onClick={() => router.push(`/bookings/${bookingId}/send`)}>
            <Send size={16} />
            Send to Traveler
          </button>
        </div>
      }
    >
      <div className="booking-detail">
        {/* Header */}
        <div className="booking-detail-header">
          <button className="btn-link" onClick={() => router.push('/bookings')}>
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="booking-detail-title-section">
            <code className="booking-code-large">{booking.booking_code || booking.code || bookingId}</code>
            <span className={`status-badge status-${booking.status || 'draft'}`}>
              {booking.status || 'draft'}
            </span>
            <h1>{booking.title || 'Untitled Trip'}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="booking-detail-tabs">
          {[
            { id: 'overview' as Tab, label: 'Overview', icon: Calendar },
            { id: 'itinerary' as Tab, label: 'Itinerary', icon: Calendar },
            { id: 'travelers' as Tab, label: 'Travelers', icon: Users },
            { id: 'flights' as Tab, label: 'Flights', icon: Plane },
            { id: 'messages' as Tab, label: 'Messages', icon: MessageSquare },
            { id: 'activity' as Tab, label: 'Activity', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`booking-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="booking-detail-content">
          {activeTab === 'overview' && (
            <div className="booking-overview">
              <div className="booking-stats-grid">
                <div className="booking-stat-card">
                  <h3>Total Value</h3>
                  <p className="stat-value">
                    {booking.total_price 
                      ? `${booking.currency || 'USD'} ${booking.total_price.toLocaleString()}`
                      : '—'
                    }
                  </p>
                </div>
                <div className="booking-stat-card">
                  <h3>Nights</h3>
                  <p className="stat-value">
                    {booking.start_date && booking.end_date
                      ? Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24))
                      : '—'
                    }
                  </p>
                </div>
                <div className="booking-stat-card">
                  <h3>Travelers</h3>
                  <p className="stat-value">{travelers.length || booking.total_travelers || 0}</p>
                </div>
                <div className="booking-stat-card">
                  <h3>Days Until Departure</h3>
                  <p className="stat-value">
                    {booking.start_date
                      ? Math.ceil((new Date(booking.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                      : '—'
                    }
                  </p>
                </div>
              </div>
              <div className="booking-info-section">
                <h3>Booking Information</h3>
                <dl>
                  <dt>Created</dt>
                  <dd>{booking.created_at ? format(new Date(booking.created_at), 'PPp') : '—'}</dd>
                  <dt>Last Modified</dt>
                  <dd>{booking.updated_at ? format(new Date(booking.updated_at), 'PPp') : '—'}</dd>
                </dl>
              </div>
              {booking.notes && (
                <div className="booking-notes-section">
                  <h3>Notes</h3>
                  <p>{booking.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div className="booking-itinerary">
              <p>Itinerary view - to be implemented</p>
              <button onClick={() => router.push(`/bookings/${bookingId}/itinerary`)}>
                Open Full Itinerary Editor
              </button>
            </div>
          )}

          {activeTab === 'travelers' && (
            <div className="booking-travelers">
              {travelersLoading ? (
                <div className="travelers-list">
                  {Array.from({ length: 3 }, (_, i) => (
                    <SkeletonCard key={i}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Skeleton width="48px" height="48px" circle />
                        <div style={{ flex: 1 }}>
                          <Skeleton width="150px" height="1rem" />
                          <Skeleton width="200px" height="0.875rem" style={{ marginTop: '0.5rem' }} />
                        </div>
                      </div>
                    </SkeletonCard>
                  ))}
                </div>
              ) : travelers && travelers.length > 0 ? (
                <div className="travelers-list">
                  {travelers.map((traveler: any, idx: number) => (
                    <div key={traveler.id || traveler.traveler_id || idx} className="traveler-card">
                      <div className="traveler-avatar">
                        {traveler.first_name?.charAt(0) || 'T'}
                      </div>
                      <div className="traveler-info">
                        <h4>{traveler.first_name} {traveler.last_name}</h4>
                        {traveler.phone && <p>{traveler.phone}</p>}
                        {traveler.email && <p>{traveler.email}</p>}
                      </div>
                      <button
                        className="btn-secondary"
                        onClick={() => router.push(`/travelers/${traveler.id || traveler.traveler_id}`)}
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Users size={48} />
                  <h3>No travelers yet</h3>
                  <p>Add travelers to this booking</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'flights' && (
            <div className="booking-flights">
              {flightsLoading ? (
                <div className="flights-list">
                  {Array.from({ length: 2 }, (_, i) => (
                    <SkeletonCard key={i}>
                      <div style={{ marginBottom: '1rem' }}>
                        <Skeleton width="200px" height="1.25rem" />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <Skeleton width="80px" height="2rem" />
                          <Skeleton width="120px" height="0.875rem" style={{ marginTop: '0.5rem' }} />
                        </div>
                        <Skeleton width="24px" height="24px" />
                        <div style={{ flex: 1 }}>
                          <Skeleton width="80px" height="2rem" />
                          <Skeleton width="120px" height="0.875rem" style={{ marginTop: '0.5rem' }} />
                        </div>
                      </div>
                    </SkeletonCard>
                  ))}
                </div>
              ) : flights && flights.length > 0 ? (
                <div className="flights-list">
                  {flights.map((flight: any, idx: number) => (
                    <div key={flight.id || flight.flight_id || idx} className="flight-card">
                      <div className="flight-header">
                        <h4>
                          {flight.airline_name || flight.airline || 'Airline'} {flight.flight_number || ''}
                        </h4>
                        <span className={`status-badge status-${flight.status || 'confirmed'}`}>
                          {flight.status || 'confirmed'}
                        </span>
                      </div>
                      <div className="flight-route">
                        <div className="flight-airport">
                          <div className="airport-code">{flight.departure_airport || flight.origin || 'N/A'}</div>
                          <div className="airport-time">
                            {(flight.scheduled_departure || flight.departure_time)
                              ? format(new Date(flight.scheduled_departure || flight.departure_time), 'MMM d, HH:mm')
                              : 'TBD'
                            }
                          </div>
                        </div>
                        <div className="flight-arrow">
                          <Plane size={20} />
                        </div>
                        <div className="flight-airport">
                          <div className="airport-code">{flight.arrival_airport || flight.destination || 'N/A'}</div>
                          <div className="airport-time">
                            {(flight.scheduled_arrival || flight.arrival_time)
                              ? format(new Date(flight.scheduled_arrival || flight.arrival_time), 'MMM d, HH:mm')
                              : 'TBD'
                            }
                          </div>
                        </div>
                      </div>
                      {flight.booking_reference && (
                        <div className="flight-pnr">
                          <strong>PNR:</strong> <code>{flight.booking_reference}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Plane size={48} />
                  <h3>No flights yet</h3>
                  <p>Add flights to this booking</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="booking-messages">
              {messagesLoading ? (
                <p>Loading messages...</p>
              ) : messages && messages.length > 0 ? (
                <div className="messages-list">
                  {messages.map((message: any, idx: number) => (
                    <div key={message.id || message.message_id || idx} className="message-card">
                      <div className="message-header">
                        <div className="message-sender">
                          <strong>{message.sender_name || message.sender || 'Unknown'}</strong>
                          {message.sender_type && (
                            <span className="sender-type">({message.sender_type})</span>
                          )}
                        </div>
                        <div className="message-date">
                          {message.sent_at || message.created_at
                            ? format(new Date(message.sent_at || message.created_at), 'MMM d, yyyy HH:mm')
                            : 'Unknown date'
                          }
                        </div>
                      </div>
                      <div className="message-content">
                        {message.content || message.message || 'No content'}
                      </div>
                      {message.status && (
                        <div className="message-status">
                          <span className={`status-badge status-${message.status}`}>
                            {message.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <h3>No messages yet</h3>
                  <p>Start a conversation with your travelers</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="booking-activity">
              {/* Hotels Section */}
              <div className="activity-section">
                <h3>Hotels</h3>
                {hotelsLoading ? (
                  <p>Loading hotels...</p>
                ) : hotels && hotels.length > 0 ? (
                  <div className="hotels-list">
                    {hotels.map((hotel: any, idx: number) => (
                      <div key={hotel.id || hotel.hotel_id || idx} className="activity-card">
                        <h4>{hotel.name || hotel.hotel_name || 'Hotel'}</h4>
                        <p>{hotel.address || hotel.location || 'Location not specified'}</p>
                        {hotel.check_in_date && hotel.check_out_date && (
                          <p className="activity-dates">
                            {format(new Date(hotel.check_in_date), 'MMM d')} - {format(new Date(hotel.check_out_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        {hotel.confirmation_number && (
                          <p className="activity-conf">
                            <strong>Confirmation:</strong> <code>{hotel.confirmation_number}</code>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="activity-empty">No hotels added</p>
                )}
              </div>

              {/* Transfers Section */}
              <div className="activity-section">
                <h3>Transfers</h3>
                {transfersLoading ? (
                  <p>Loading transfers...</p>
                ) : transfers && transfers.length > 0 ? (
                  <div className="transfers-list">
                    {transfers.map((transfer: any, idx: number) => (
                      <div key={transfer.id || transfer.transfer_id || idx} className="activity-card">
                        <h4>{transfer.transfer_type || transfer.type || 'Transfer'}</h4>
                        <p>
                          {transfer.from_location || transfer.pickup_location || 'Pickup'} → {transfer.to_location || transfer.dropoff_location || 'Dropoff'}
                        </p>
                        {(transfer.scheduled_datetime || transfer.pickup_time) && (
                          <p className="activity-dates">
                            {format(new Date(transfer.scheduled_datetime || transfer.pickup_time), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                        {transfer.vehicle_type && (
                          <p className="activity-detail">Vehicle: {transfer.vehicle_type}</p>
                        )}
                        {transfer.driver_name && (
                          <p className="activity-detail">Driver: {transfer.driver_name}</p>
                        )}
                        {transfer.driver_phone && (
                          <p className="activity-detail">Phone: {transfer.driver_phone}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="activity-empty">No transfers added</p>
                )}
              </div>

              {/* Activities Section */}
              <div className="activity-section">
                <h3>Activities & Excursions</h3>
                {activitiesLoading ? (
                  <p>Loading activities...</p>
                ) : activities && activities.length > 0 ? (
                  <div className="activities-list">
                    {activities.map((activity: any, idx: number) => (
                      <div key={activity.id || activity.activity_id || idx} className="activity-card">
                        <h4>{activity.activity_name || activity.name || activity.title || 'Activity'}</h4>
                        <p>{activity.description || 'No description'}</p>
                        {(activity.scheduled_datetime || activity.date) && (
                          <p className="activity-dates">
                            {format(new Date(activity.scheduled_datetime || activity.date), 'MMM d, yyyy HH:mm')}
                          </p>
                        )}
                        {activity.duration_minutes && (
                          <p className="activity-detail">Duration: {activity.duration_minutes} minutes</p>
                        )}
                        {activity.duration && !activity.duration_minutes && (
                          <p className="activity-detail">Duration: {activity.duration}</p>
                        )}
                        {activity.location && (
                          <p className="activity-detail">Location: {activity.location}</p>
                        )}
                        {activity.supplier_name && (
                          <p className="activity-detail">Supplier: {activity.supplier_name}</p>
                        )}
                        {activity.price && (
                          <p className="activity-detail">Price: {activity.currency || 'USD'} {activity.price.toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="activity-empty">No activities added</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingDetailContent />
    </Suspense>
  );
}


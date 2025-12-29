'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Copy, Send, Download, Trash2, Calendar, Users, Plane, MessageSquare, Activity } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import '../bookings.css';
import './booking-detail.css';

type Tab = 'overview' | 'itinerary' | 'travelers' | 'flights' | 'messages' | 'activity';

function BookingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading booking...</div>
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
                  <p className="stat-value">{booking.total_travelers || booking.travelers?.length || 0}</p>
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
              {booking.travelers && booking.travelers.length > 0 ? (
                <div className="travelers-list">
                  {booking.travelers.map((traveler: any, idx: number) => (
                    <div key={idx} className="traveler-card">
                      <div className="traveler-avatar">
                        {traveler.first_name?.charAt(0) || 'T'}
                      </div>
                      <div className="traveler-info">
                        <h4>{traveler.first_name} {traveler.last_name}</h4>
                        <p>{traveler.contact?.phone || traveler.phone || 'No phone'}</p>
                        <p>{traveler.contact?.email || traveler.email || 'No email'}</p>
                      </div>
                      <button onClick={() => router.push(`/travelers/${traveler.id || traveler.traveler_id}`)}>
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No travelers linked to this booking</p>
              )}
            </div>
          )}

          {activeTab === 'flights' && (
            <div className="booking-flights">
              <p>Flight information - to be implemented</p>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="booking-messages">
              <p>Message history - to be implemented</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="booking-activity">
              <p>Activity log - to be implemented</p>
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


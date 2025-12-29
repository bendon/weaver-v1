'use client';

import { Suspense, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, eachDayOfInterval, isSameDay } from 'date-fns';
import { ArrowLeft, Plane, Hotel, Car, Compass, Calendar, MapPin, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import './itinerary.css';

interface ItineraryItem {
  type: 'flight' | 'hotel' | 'transfer' | 'activity';
  time: Date;
  data: any;
}

function BookingItineraryContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  // Fetch all booking data
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  const { data: flightsData } = useQuery({
    queryKey: ['booking-flights', bookingId],
    queryFn: () => api.getBookingFlights(bookingId),
    enabled: !!bookingId,
  });

  const { data: hotelsData } = useQuery({
    queryKey: ['booking-hotels', bookingId],
    queryFn: () => api.getBookingHotels(bookingId),
    enabled: !!bookingId,
  });

  const { data: transfersData } = useQuery({
    queryKey: ['booking-transfers', bookingId],
    queryFn: () => api.getBookingTransfers(bookingId),
    enabled: !!bookingId,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ['booking-activities', bookingId],
    queryFn: () => api.getBookingActivities(bookingId),
    enabled: !!bookingId,
  });

  const flights = flightsData?.flights || [];
  const hotels = hotelsData?.hotels || [];
  const transfers = transfersData?.transfers || [];
  const activities = activitiesData?.activities || [];

  // Organize items by day
  const itineraryByDay = useMemo(() => {
    if (!booking?.start_date || !booking?.end_date) return {};

    const startDate = parseISO(booking.start_date);
    const endDate = parseISO(booking.end_date);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const dayMap: Record<string, ItineraryItem[]> = {};

    // Initialize all days
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      dayMap[key] = [];
    });

    // Add flights
    flights.forEach((flight: any) => {
      if (flight.departure_time) {
        const flightDate = parseISO(flight.departure_time);
        const key = format(flightDate, 'yyyy-MM-dd');
        if (dayMap[key]) {
          dayMap[key].push({
            type: 'flight',
            time: flightDate,
            data: flight,
          });
        }
      }
    });

    // Add hotels
    hotels.forEach((hotel: any) => {
      if (hotel.check_in_date) {
        const checkInDate = parseISO(hotel.check_in_date);
        const key = format(checkInDate, 'yyyy-MM-dd');
        if (dayMap[key]) {
          dayMap[key].push({
            type: 'hotel',
            time: checkInDate,
            data: hotel,
          });
        }
      }
    });

    // Add transfers
    transfers.forEach((transfer: any) => {
      if (transfer.pickup_time) {
        const transferDate = parseISO(transfer.pickup_time);
        const key = format(transferDate, 'yyyy-MM-dd');
        if (dayMap[key]) {
          dayMap[key].push({
            type: 'transfer',
            time: transferDate,
            data: transfer,
          });
        }
      }
    });

    // Add activities
    activities.forEach((activity: any) => {
      if (activity.date) {
        const activityDate = parseISO(activity.date);
        const key = format(activityDate, 'yyyy-MM-dd');
        if (dayMap[key]) {
          dayMap[key].push({
            type: 'activity',
            time: activityDate,
            data: activity,
          });
        }
      }
    });

    // Sort items within each day by time
    Object.keys(dayMap).forEach(key => {
      dayMap[key].sort((a, b) => a.time.getTime() - b.time.getTime());
    });

    return dayMap;
  }, [booking, flights, hotels, transfers, activities]);

  if (bookingLoading) {
    return (
      <DashboardLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading itinerary...</div>
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

  const days = booking.start_date && booking.end_date
    ? eachDayOfInterval({
        start: parseISO(booking.start_date),
        end: parseISO(booking.end_date),
      })
    : [];

  return (
    <DashboardLayout
      title="Itinerary"
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: booking.booking_code || bookingId, href: `/bookings/${bookingId}` },
        { label: 'Itinerary' },
      ]}
    >
      <div className="itinerary-page">
        {/* Header */}
        <div className="itinerary-header">
          <button className="btn-link" onClick={() => router.push(`/bookings/${bookingId}`)}>
            <ArrowLeft size={20} />
            Back to Booking
          </button>
          <h1>{booking.title || 'Trip Itinerary'}</h1>
          <p className="itinerary-dates">
            {booking.start_date && booking.end_date && (
              <>
                {format(parseISO(booking.start_date), 'MMMM d, yyyy')} - {format(parseISO(booking.end_date), 'MMMM d, yyyy')}
                <span className="itinerary-duration">
                  ({days.length} {days.length === 1 ? 'day' : 'days'})
                </span>
              </>
            )}
          </p>
        </div>

        {/* Day-by-day timeline */}
        <div className="itinerary-timeline">
          {days.length === 0 ? (
            <div className="itinerary-empty">
              <Calendar size={48} />
              <h3>No dates set</h3>
              <p>Set start and end dates for this booking to view the itinerary timeline</p>
            </div>
          ) : (
            days.map((day, index) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const items = itineraryByDay[dayKey] || [];

              return (
                <div key={dayKey} className="itinerary-day">
                  <div className="itinerary-day-header">
                    <div className="itinerary-day-number">Day {index + 1}</div>
                    <div className="itinerary-day-date">
                      <Calendar size={16} />
                      {format(day, 'EEEE, MMMM d, yyyy')}
                    </div>
                  </div>

                  <div className="itinerary-day-content">
                    {items.length === 0 ? (
                      <div className="itinerary-day-empty">
                        <p>No activities scheduled</p>
                      </div>
                    ) : (
                      <div className="itinerary-items">
                        {items.map((item, idx) => (
                          <div key={idx} className={`itinerary-item itinerary-item-${item.type}`}>
                            {item.type === 'flight' && (
                              <>
                                <div className="itinerary-item-icon">
                                  <Plane size={20} />
                                </div>
                                <div className="itinerary-item-content">
                                  <div className="itinerary-item-time">
                                    <Clock size={14} />
                                    {format(item.time, 'HH:mm')}
                                  </div>
                                  <h4>
                                    {item.data.airline_name || item.data.airline || 'Flight'} {item.data.flight_number || ''}
                                  </h4>
                                  <p className="itinerary-item-route">
                                    {item.data.origin || item.data.departure_airport} → {item.data.destination || item.data.arrival_airport}
                                  </p>
                                  {item.data.booking_reference && (
                                    <p className="itinerary-item-detail">PNR: <code>{item.data.booking_reference}</code></p>
                                  )}
                                </div>
                              </>
                            )}

                            {item.type === 'hotel' && (
                              <>
                                <div className="itinerary-item-icon">
                                  <Hotel size={20} />
                                </div>
                                <div className="itinerary-item-content">
                                  <div className="itinerary-item-time">Check-in</div>
                                  <h4>{item.data.name || item.data.hotel_name || 'Hotel'}</h4>
                                  <p className="itinerary-item-detail">
                                    <MapPin size={14} />
                                    {item.data.address || item.data.location || 'Location not specified'}
                                  </p>
                                  {item.data.check_out_date && (
                                    <p className="itinerary-item-detail">
                                      Check-out: {format(parseISO(item.data.check_out_date), 'MMM d, yyyy')}
                                    </p>
                                  )}
                                  {item.data.confirmation_number && (
                                    <p className="itinerary-item-detail">Confirmation: <code>{item.data.confirmation_number}</code></p>
                                  )}
                                </div>
                              </>
                            )}

                            {item.type === 'transfer' && (
                              <>
                                <div className="itinerary-item-icon">
                                  <Car size={20} />
                                </div>
                                <div className="itinerary-item-content">
                                  <div className="itinerary-item-time">
                                    <Clock size={14} />
                                    {format(item.time, 'HH:mm')}
                                  </div>
                                  <h4>{item.data.type || 'Transfer'}</h4>
                                  <p className="itinerary-item-route">
                                    {item.data.pickup_location || 'Pickup'} → {item.data.dropoff_location || 'Dropoff'}
                                  </p>
                                  {item.data.vehicle_type && (
                                    <p className="itinerary-item-detail">Vehicle: {item.data.vehicle_type}</p>
                                  )}
                                </div>
                              </>
                            )}

                            {item.type === 'activity' && (
                              <>
                                <div className="itinerary-item-icon">
                                  <Compass size={20} />
                                </div>
                                <div className="itinerary-item-content">
                                  {item.data.time && (
                                    <div className="itinerary-item-time">
                                      <Clock size={14} />
                                      {item.data.time}
                                    </div>
                                  )}
                                  <h4>{item.data.name || item.data.title || 'Activity'}</h4>
                                  {item.data.description && (
                                    <p className="itinerary-item-description">{item.data.description}</p>
                                  )}
                                  {item.data.location && (
                                    <p className="itinerary-item-detail">
                                      <MapPin size={14} />
                                      {item.data.location}
                                    </p>
                                  )}
                                  {item.data.duration && (
                                    <p className="itinerary-item-detail">Duration: {item.data.duration}</p>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BookingItineraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingItineraryContent />
    </Suspense>
  );
}


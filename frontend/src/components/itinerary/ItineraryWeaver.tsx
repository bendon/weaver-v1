import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { format, differenceInDays, isToday, isPast, isFuture } from 'date-fns';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react';
import type { Itinerary } from '../../types';
import './ItineraryWeaver.css';

interface ItineraryWeaverProps {
  bookingCode: string;
}

export const ItineraryWeaver: React.FC<ItineraryWeaverProps> = ({ bookingCode }) => {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: booking, isLoading, refetch } = useQuery({
    queryKey: ['publicItinerary', bookingCode],
    queryFn: async () => {
      try {
        return await api.getPublicItinerary(bookingCode);
      } catch (err) {
        console.error('Error fetching itinerary:', err);
        throw err;
      }
    },
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every 60 seconds if enabled
  });

  // Auto-refresh flight status
  useEffect(() => {
    if (autoRefresh && booking) {
      const interval = setInterval(() => {
        refetch();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, booking, refetch]);

  if (isLoading) {
    return (
      <div className="itinerary-weaver-loading">
        <div className="loading-spinner"></div>
        <p>Loading your itinerary...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="itinerary-weaver-error">
        <AlertCircle size={48} />
        <h2>Itinerary Not Found</h2>
        <p>The booking code you entered doesn't match any itinerary.</p>
      </div>
    );
  }

  // Calculate trip progress
  // If start_date/end_date are null, calculate from days array or flights
  let startDate: Date;
  let endDate: Date;
  
  if (booking.start_date) {
    startDate = new Date(booking.start_date);
  } else if (booking.days && booking.days.length > 0) {
    startDate = new Date(booking.days[0].date);
  } else if (booking.flights && booking.flights.length > 0 && booking.flights[0].segments && booking.flights[0].segments.length > 0) {
    startDate = new Date(booking.flights[0].segments[0].departure_datetime);
  } else {
    startDate = new Date();
  }
  
  if (booking.end_date) {
    endDate = new Date(booking.end_date);
  } else if (booking.days && booking.days.length > 0) {
    endDate = new Date(booking.days[booking.days.length - 1].date);
  } else if (booking.flights && booking.flights.length > 0) {
    const lastFlight = booking.flights[booking.flights.length - 1];
    if (lastFlight.segments && lastFlight.segments.length > 0) {
      const lastSegment = lastFlight.segments[lastFlight.segments.length - 1];
      endDate = new Date(lastSegment.arrival_datetime);
    } else {
      endDate = new Date(startDate.getTime() + (booking.duration_nights || 3) * 24 * 60 * 60 * 1000);
    }
  } else {
    endDate = new Date(startDate.getTime() + (booking.duration_nights || 3) * 24 * 60 * 60 * 1000);
  }
  
  const today = new Date();
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const daysElapsed = differenceInDays(today, startDate) + 1;
  const progress = Math.max(0, Math.min(100, (daysElapsed / totalDays) * 100));
  const currentDay = Math.max(1, Math.min(totalDays, daysElapsed));

  // Get primary traveler
  const primaryTraveler = booking.travelers?.[0] || booking.traveler;
  const travelerName = primaryTraveler
    ? `${primaryTraveler.first_name || ''} ${primaryTraveler.last_name || ''}`.trim()
    : 'Traveler';

  // Get flights - handle both flat structure and segments structure
  const flights = booking.flights || [];
  const upcomingFlights = flights.filter((f: any) => {
    // Handle flights with segments
    if (f.segments && f.segments.length > 0) {
      const firstSegment = f.segments[0];
      const depDate = new Date(firstSegment.departure_datetime);
      return isFuture(depDate) || isToday(depDate);
    }
    // Handle flat flight structure
    const depDate = new Date(f.scheduled_departure || f.departure_date || f.departure_datetime);
    return isFuture(depDate) || isToday(depDate);
  });
  
  // Helper to get flight display info
  const getFlightDisplayInfo = (flight: any) => {
    if (flight.segments && flight.segments.length > 0) {
      const firstSegment = flight.segments[0];
      const lastSegment = flight.segments[flight.segments.length - 1];
      return {
        carrier_code: firstSegment.carrier_code,
        carrier_name: firstSegment.carrier_name,
        flight_number: firstSegment.flight_number,
        departure_airport: firstSegment.departure_airport?.iata_code || firstSegment.departure_airport,
        arrival_airport: lastSegment.arrival_airport?.iata_code || lastSegment.arrival_airport,
        scheduled_departure: firstSegment.departure_datetime,
        scheduled_arrival: lastSegment.arrival_datetime,
        departure_terminal: firstSegment.departure_airport?.terminal,
        departure_gate: null, // Not in API response
        status: firstSegment.status || 'scheduled',
        checkin_url: null, // Not in API response
        flight_type: flight.segments.length > 1 ? 'return' : 'outbound',
      };
    }
    // Fallback for flat structure
    return {
      carrier_code: flight.carrier_code,
      carrier_name: flight.airline_name || flight.airline,
      flight_number: flight.flight_number,
      departure_airport: flight.departure_airport,
      arrival_airport: flight.arrival_airport,
      scheduled_departure: flight.scheduled_departure || flight.departure_date || flight.departure_datetime,
      scheduled_arrival: flight.scheduled_arrival || flight.arrival_date || flight.arrival_datetime,
      departure_terminal: flight.departure_terminal,
      departure_gate: flight.departure_gate,
      status: flight.status || 'scheduled',
      checkin_url: flight.checkin_url,
      flight_type: flight.flight_type || 'outbound',
    };
  };

  const getFlightStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'on_time':
        return 'status-on-time';
      case 'delayed':
        return 'status-delayed';
      case 'boarding':
        return 'status-boarding';
      case 'departed':
      case 'in_air':
        return 'status-in-air';
      case 'landed':
        return 'status-landed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  };

  const getFlightStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'on_time':
        return '✅ ON TIME';
      case 'delayed':
        return '⚠️ DELAYED';
      case 'boarding':
        return '🔄 BOARDING';
      case 'departed':
      case 'in_air':
        return '✈️ IN AIR';
      case 'landed':
        return '✅ LANDED';
      case 'cancelled':
        return '❌ CANCELLED';
      default:
        return '⏳ SCHEDULED';
    }
  };

  return (
    <div className="itinerary-weaver">
      {/* Header */}
      <header className="itinerary-header">
        <div className="itinerary-header-content">
          <h1 className="itinerary-title">{booking.title || 'Your Trip'}</h1>
          <p className="itinerary-travelers">
            {travelerName}
            {booking.total_travelers > 1 && ` + ${booking.total_travelers - 1} other${booking.total_travelers > 2 ? 's' : ''}`}
          </p>
          <div className="itinerary-meta">
            <span className="meta-item">
              <Calendar size={16} />
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </span>
            <span className="meta-item">
              <Users size={16} />
              {booking.total_travelers || 1} traveler{booking.total_travelers !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="itinerary-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="progress-text">
          Day {currentDay} of {totalDays} ({Math.round(progress)}% complete)
        </p>
      </div>

      {/* Today's Schedule */}
      {booking.days && booking.days.length > 0 && (
        <section className="itinerary-section">
          <h2 className="section-title">TODAY - {format(new Date(), 'EEE, MMM d')}</h2>
          <div className="day-events">
            {booking.days
              .filter((day: any) => {
                const dayDate = new Date(day.date);
                return isToday(dayDate);
              })
              .flatMap((day: any) => day.activities || [])
              .map((activity: any, idx: number) => (
                <div key={idx} className="event-card">
                  <div className="event-time">
                    {activity.start_time || activity.scheduled_datetime 
                      ? format(new Date(activity.start_time || activity.scheduled_datetime), 'HH:mm')
                      : 'All Day'}
                  </div>
                  <div className="event-content">
                    <h3 className="event-title">{activity.name || activity.activity_name}</h3>
                    {activity.location && (
                      <p className="event-location">
                        <MapPin size={14} />
                        {activity.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            {booking.days
              .filter((day: any) => {
                const dayDate = new Date(day.date);
                return isToday(dayDate);
              })
              .flatMap((day: any) => day.activities || [])
              .length === 0 && (
              <p className="no-events">No activities scheduled for today</p>
            )}
          </div>
        </section>
      )}

      {/* Upcoming Days */}
      {booking.days && booking.days.length > 0 && (
        <section className="itinerary-section">
          <h2 className="section-title">UPCOMING DAYS</h2>
          <div className="days-list">
            {booking.days
              .filter((day: any) => {
                const dayDate = new Date(day.date);
                return isFuture(dayDate) || (isToday(dayDate) && expandedDay === day.day_number);
              })
              .map((day: any) => (
                <div key={day.day_number} className="day-card">
                  <button
                    className="day-card-header"
                    onClick={() => setExpandedDay(expandedDay === day.day_number ? null : day.day_number)}
                  >
                    <div>
                      <h3 className="day-title">
                        {format(new Date(day.date), 'EEE, MMM d')}
                      </h3>
                      <p className="day-location">{day.location || 'Various locations'}</p>
                    </div>
                    {expandedDay === day.day_number ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                  {expandedDay === day.day_number && (
                    <div className="day-events">
                      {(day.activities || []).map((activity: any, idx: number) => (
                        <div key={idx} className="event-card">
                          <div className="event-time">
                            {activity.start_time || activity.scheduled_datetime
                              ? format(new Date(activity.start_time || activity.scheduled_datetime), 'HH:mm')
                              : 'All Day'}
                          </div>
                          <div className="event-content">
                            <h3 className="event-title">{activity.name || activity.activity_name}</h3>
                            {activity.location && (
                              <p className="event-location">
                                <MapPin size={14} />
                                {activity.location}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {(!day.activities || day.activities.length === 0) && (
                        <p className="no-events">No activities scheduled</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Flights */}
      {upcomingFlights.length > 0 && (
        <section className="itinerary-section">
          <h2 className="section-title">✈️ YOUR FLIGHTS</h2>
          <div className="flights-list">
            {upcomingFlights.map((flight: any, idx: number) => {
              const flightInfo = getFlightDisplayInfo(flight);
              const hasMultipleSegments = flight.segments && flight.segments.length > 1;
              
              return (
                <div key={idx} className="flight-card">
                  <div className="flight-header">
                    <div>
                      <h3 className="flight-title">
                        {flightInfo.flight_type === 'return' ? 'RETURN' : hasMultipleSegments ? 'MULTI-SEGMENT' : 'OUTBOUND'} - {format(new Date(flightInfo.scheduled_departure), 'MMM d')}
                      </h3>
                      <p className="flight-route">
                        {flightInfo.departure_airport} → {flightInfo.arrival_airport}
                        {hasMultipleSegments && ` (${flight.segments.length} segments)`}
                      </p>
                    </div>
                    <span className={`flight-status ${getFlightStatusColor(flightInfo.status)}`}>
                      {getFlightStatusText(flightInfo.status)}
                    </span>
                  </div>
                  <div className="flight-details">
                    <div className="flight-detail">
                      <Plane size={16} />
                      <span>
                        {flightInfo.carrier_code} {flightInfo.flight_number}
                        {flightInfo.carrier_name && ` (${flightInfo.carrier_name})`}
                      </span>
                    </div>
                    <div className="flight-detail">
                      <Clock size={16} />
                      <span>
                        {format(new Date(flightInfo.scheduled_departure), 'HH:mm')} - {format(new Date(flightInfo.scheduled_arrival), 'HH:mm')}
                      </span>
                    </div>
                    {flightInfo.departure_terminal && (
                      <div className="flight-detail">
                        <MapPin size={16} />
                        <span>Terminal: {flightInfo.departure_terminal}</span>
                      </div>
                    )}
                    {flightInfo.departure_gate && (
                      <div className="flight-detail">
                        <MapPin size={16} />
                        <span>Gate: {flightInfo.departure_gate}</span>
                      </div>
                    )}
                    {flight.pnr && (
                      <div className="flight-detail">
                        <span>PNR: {flight.pnr}</span>
                      </div>
                    )}
                  </div>
                  {hasMultipleSegments && (
                    <div className="flight-segments">
                      <p className="segments-label">Flight segments:</p>
                      {flight.segments.map((segment: any, segIdx: number) => (
                        <div key={segIdx} className="segment-info">
                          <span className="segment-route">
                            {segment.departure_airport?.iata_code || segment.departure_airport} → {segment.arrival_airport?.iata_code || segment.arrival_airport}
                          </span>
                          <span className="segment-time">
                            {format(new Date(segment.departure_datetime), 'HH:mm')} - {format(new Date(segment.arrival_datetime), 'HH:mm')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {flightInfo.checkin_url && (
                    <a
                      href={flightInfo.checkin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flight-action-btn"
                    >
                      <ExternalLink size={16} />
                      Check-in
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hotels */}
      {booking.hotels && booking.hotels.length > 0 && (
        <section className="itinerary-section">
          <h2 className="section-title">🏨 YOUR HOTELS</h2>
          <div className="hotels-list">
            {booking.hotels.map((hotel: any, idx: number) => {
              const hotelName = hotel.hotel?.name || hotel.hotel_name || hotel.name;
              const hotelAddress = hotel.hotel?.address || hotel.address;
              
              return (
                <div key={idx} className="hotel-card">
                  <Hotel size={24} className="hotel-icon" />
                  <div className="hotel-info">
                    <h3 className="hotel-name">{hotelName}</h3>
                    {hotel.hotel?.star_rating && (
                      <p className="hotel-rating">{'⭐'.repeat(hotel.hotel.star_rating)}</p>
                    )}
                    <p className="hotel-dates">
                      {format(new Date(hotel.check_in_date), 'MMM d')} - {format(new Date(hotel.check_out_date), 'MMM d, yyyy')}
                    </p>
                    {hotelAddress && (
                      <p className="hotel-address">
                        <MapPin size={14} />
                        {hotelAddress}
                      </p>
                    )}
                    {hotel.confirmation_number && (
                      <p className="hotel-confirmation">
                        Confirmation: {hotel.confirmation_number}
                      </p>
                    )}
                    {hotel.room_type && (
                      <p className="hotel-room">
                        Room: {hotel.room_type}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="itinerary-section contact-section">
        <h2 className="section-title">📞 NEED HELP?</h2>
        <div className="contact-buttons">
          {booking.branding?.contact_whatsapp && (
            <a
              href={`https://wa.me/${booking.branding.contact_whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn whatsapp-btn"
            >
              <MessageSquare size={20} />
              WhatsApp
            </a>
          )}
          {booking.branding?.contact_phone && (
            <a
              href={`tel:${booking.branding.contact_phone}`}
              className="contact-btn phone-btn"
            >
              <Phone size={20} />
              Call
            </a>
          )}
        </div>
      </section>
    </div>
  );
};


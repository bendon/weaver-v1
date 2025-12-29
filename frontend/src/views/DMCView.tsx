import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Bell, Building2, ClipboardList, CheckCircle, DollarSign, Star,
  Plus, Send, Link as LinkIcon, BarChart3, Settings, Users, FileText,
  Eye, Edit, Trash2, Search, Filter, LogOut, X, ArrowLeft, Plane, Hotel, Car, Calendar, User, Phone, Mail
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Itinerary } from '../types';
import { TravelWeaverDashboard } from '../components/dashboard/TravelWeaverDashboard';
import './DMCView.css';

function DMCView() {
  const navigate = useNavigate();
  const { itineraryId } = useParams<{ itineraryId?: string }>();
  const { user, token, logout } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'cancelled'>('all');
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    traveler_name: '',
    traveler_phone: '',
    traveler_email: '',
    title: '',
    start_date: '',
    end_date: ''
  });

  // Fetch booking details if booking ID is in URL
  const { data: bookingDetails, isLoading: bookingDetailsLoading } = useQuery({
    queryKey: ['booking', itineraryId],
    queryFn: async () => {
      if (!itineraryId || !token) return null;
      try {
        const booking = await api.getBooking(itineraryId);
        // Also fetch related data
        const [travelers, flights, hotels, transfers, activities] = await Promise.all([
          api.getBookingTravelers(itineraryId).catch(() => ({ travelers: [], total: 0 })),
          api.getBookingFlights(itineraryId).catch(() => ({ flights: [], total: 0 })),
          api.getBookingHotels(itineraryId).catch(() => ({ hotels: [], total: 0 })),
          api.getBookingTransfers(itineraryId).catch(() => ({ transfers: [], total: 0 })),
          api.getBookingActivities(itineraryId).catch(() => ({ activities: [], total: 0 })),
        ]);
        return {
          ...booking,
          travelers: travelers.travelers,
          flights: flights.flights,
          hotels: hotels.hotels,
          transfers: transfers.transfers,
          activities: activities.activities,
        };
      } catch (err) {
        console.error('Error fetching booking:', err);
        return null;
      }
    },
    enabled: !!itineraryId && !!token,
  });

  // Fetch bookings from API
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: async () => {
      if (!token) return { bookings: [], total: 0 };
      try {
        return await api.getBookings(statusFilter === 'all' ? undefined : statusFilter);
      } catch (err) {
        return { bookings: [], total: 0 };
      }
    },
    enabled: !!token && !itineraryId, // Only fetch list when not viewing details
  });

  // Also fetch itineraries for backward compatibility
  const { data: itineraries, isLoading: itinerariesLoading } = useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => {
      try {
        return await api.getAllItineraries();
      } catch (err) {
        return [];
      }
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        console.error('No token available');
        throw new Error('Not authenticated. Please login again.');
      }
      
      console.log('Creating booking with token:', token ? 'Token present' : 'No token');
      
      // First create traveler, then booking, then link them
      const names = newBooking.traveler_name.split(' ');
      const first_name = names[0] || 'Traveler';
      const last_name = names.slice(1).join(' ') || 'Unknown';
      
      try {
        // Create traveler first
        console.log('Creating traveler...');
        const traveler = await api.createTraveler(
          first_name,
          last_name,
          newBooking.traveler_phone,
          newBooking.traveler_email
        );
        console.log('Traveler created:', traveler.id);
        
        // Then create booking (no traveler_id needed in new API)
        console.log('Creating booking...');
        const booking = await api.createBooking(
          newBooking.title,
          newBooking.start_date,
          newBooking.end_date,
          1, // total_travelers
          undefined // notes
        );
        console.log('Booking created:', booking.id);
        
        // Link traveler to booking
        console.log('Linking traveler to booking...');
        await api.linkTravelerToBooking(booking.id, traveler.id, true); // is_primary = true
        
        return booking;
      } catch (error: any) {
        console.error('Error creating booking:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setShowCreateBooking(false);
      setNewBooking({
        traveler_name: '',
        traveler_phone: '',
        traveler_email: '',
        title: '',
        start_date: '',
        end_date: ''
      });
    },
    onError: (error: Error) => {
      console.error('Error creating booking:', error);
      // Error will be handled by the global auth error handler if it's an auth error
      if (!error.message.toLowerCase().includes('session') && 
          !error.message.toLowerCase().includes('expired')) {
        alert(error.message || 'Failed to create booking');
      }
    },
  });

  const bookings = bookingsData?.bookings || [];
  const isLoading = bookingsLoading || itinerariesLoading;

  // If viewing a specific booking, show detail view
  if (itineraryId) {
    return <BookingDetailView bookingId={itineraryId} booking={bookingDetails} isLoading={bookingDetailsLoading} />;
  }

  // Use the new TravelWeaver Dashboard for the main view
  return <TravelWeaverDashboard />;
}

export default DMCView;

// Booking Detail View Component
interface BookingDetailViewProps {
  bookingId: string;
  booking: any;
  isLoading: boolean;
}

function BookingDetailView({ bookingId, booking, isLoading }: BookingDetailViewProps) {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-black mb-4">Booking not found</h2>
            <button 
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => navigate('/dmc')}
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with back button */}
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dmc')}
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Bookings</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => navigate('/dmc')} 
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="h-9 w-9 rounded-full bg-black flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-black">{booking.title || 'Booking Details'}</h1>
            <p className="text-gray-500 mt-1">Booking Code: {booking.booking_code}</p>
          </div>
        </header>

        {/* Booking Details */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Status Badge */}
            <div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                booking.status === 'confirmed' || booking.status === 'active' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : booking.status === 'cancelled'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {booking.status}
              </span>
            </div>

            {/* Traveler Information */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Traveler Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {booking.traveler && (
                  <>
                    <div className="flex items-center gap-3">
                      <User size={20} className="text-black" />
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Name</div>
                        <div className="font-semibold text-black">
                          {booking.traveler.first_name} {booking.traveler.last_name}
                        </div>
                      </div>
                    </div>
                    {booking.traveler.phone && (
                      <div className="flex items-center gap-3">
                        <Phone size={20} className="text-black" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Phone</div>
                          <div className="font-semibold text-black">{booking.traveler.phone}</div>
                        </div>
                      </div>
                    )}
                    {booking.traveler.email && (
                      <div className="flex items-center gap-3">
                        <Mail size={20} className="text-black" />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Email</div>
                          <div className="font-semibold text-black">{booking.traveler.email}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* Trip Dates */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Trip Dates</h2>
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-black" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Duration</div>
                  <div className="font-semibold text-black">
                    {booking.start_date && !isNaN(new Date(booking.start_date).getTime()) 
                      ? format(new Date(booking.start_date), 'MMM d, yyyy') 
                      : 'TBD'} - {booking.end_date && !isNaN(new Date(booking.end_date).getTime())
                      ? format(new Date(booking.end_date), 'MMM d, yyyy')
                      : 'TBD'}
                  </div>
                </div>
              </div>
            </section>

            {/* Flights */}
            {booking.flights && booking.flights.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Flights</h2>
                <div className="space-y-3">
                  {booking.flights.map((flight: any, index: number) => {
                    // Handle flight data structure - could be from segments or flat structure
                    const origin = flight.origin || flight.departure_airport?.iata_code || flight.departure_airport || 'N/A';
                    const destination = flight.destination || flight.arrival_airport?.iata_code || flight.arrival_airport || 'N/A';
                    const airline = flight.airline || flight.carrier_code || flight.carrier_name || 'N/A';
                    const flightNumber = flight.flight_number || 'N/A';
                    
                    // Handle departure time - could be in various formats
                    let departureTime: Date | null = null;
                    if (flight.departure_time) {
                      departureTime = new Date(flight.departure_time);
                    } else if (flight.departure_datetime) {
                      departureTime = new Date(flight.departure_datetime);
                    } else if (flight.scheduled_departure) {
                      departureTime = new Date(flight.scheduled_departure);
                    } else if (flight.segments && flight.segments.length > 0) {
                      departureTime = new Date(flight.segments[0].departure_datetime);
                    }
                    
                    const isValidDate = departureTime && !isNaN(departureTime.getTime());
                    const formattedDate = isValidDate ? format(departureTime, 'MMM d, yyyy HH:mm') : 'TBD';
                    
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Plane size={24} className="text-black" />
                        <div className="flex-1">
                          <div className="font-semibold text-black mb-1">
                            {origin} → {destination}
                          </div>
                          <div className="text-sm text-gray-600">
                            {airline} {flightNumber} • {formattedDate}
                          </div>
                        </div>
                        {flight.status && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            flight.status === 'scheduled' || flight.status === 'on_time' || flight.status === 'confirmed'
                              ? 'bg-green-50 text-green-700'
                              : flight.status === 'delayed'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}>
                            {flight.status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Hotels */}
            {booking.hotels && booking.hotels.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-black mb-4">Hotels</h2>
                <div className="space-y-3">
                  {booking.hotels.map((hotel: any, index: number) => {
                    const hotelName = hotel.name || hotel.hotel_name || hotel.hotel?.name || 'Hotel';
                    const checkIn = hotel.check_in_date || hotel.check_in;
                    const checkOut = hotel.check_out_date || hotel.check_out;
                    
                    const checkInDate = checkIn ? new Date(checkIn) : null;
                    const checkOutDate = checkOut ? new Date(checkOut) : null;
                    
                    const isValidCheckIn = checkInDate && !isNaN(checkInDate.getTime());
                    const isValidCheckOut = checkOutDate && !isNaN(checkOutDate.getTime());
                    
                    const formattedCheckIn = isValidCheckIn ? format(checkInDate, 'MMM d') : 'TBD';
                    const formattedCheckOut = isValidCheckOut ? format(checkOutDate, 'MMM d, yyyy') : 'TBD';
                    
                    return (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <Hotel size={24} className="text-black" />
                        <div className="flex-1">
                          <div className="font-semibold text-black mb-1">{hotelName}</div>
                          <div className="text-sm text-gray-600">
                            {formattedCheckIn} - {formattedCheckOut}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <button 
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                onClick={() => navigate(`/pnr/import?bookingId=${bookingId}`)}
              >
                <LinkIcon size={16} />
                Import PNR
              </button>
              <button 
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-black rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // TODO: Implement edit functionality
                  alert('Edit functionality coming soon');
                }}
              >
                <Edit size={16} />
                Edit Booking
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface BookingCardProps {
  booking: any;
  onView: () => void;
}

function BookingCard({ booking, onView }: BookingCardProps) {
  return (
    <div className="itinerary-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{booking.title}</h3>
          <p className="card-ref">Code: {booking.booking_code}</p>
        </div>
        <span className={`card-badge ${booking.status}`}>{booking.status}</span>
      </div>

      <div className="card-content">
        <div className="card-dates">
          {booking.start_date && !isNaN(new Date(booking.start_date).getTime())
            ? format(new Date(booking.start_date), 'MMM d')
            : 'TBD'} - {booking.end_date && !isNaN(new Date(booking.end_date).getTime())
            ? format(new Date(booking.end_date), 'MMM d, yyyy')
            : 'TBD'}
        </div>
      </div>

      <div className="card-actions">
        <button className="card-action-btn" onClick={onView}>
          <Eye size={16} />
          View
        </button>
        <button className="card-action-btn">
          <Edit size={16} />
          Edit
        </button>
      </div>
    </div>
  );
}

interface ItineraryCardProps {
  itinerary: Itinerary;
  onView: () => void;
}

function ItineraryCard({ itinerary, onView }: ItineraryCardProps) {
  const startDate = itinerary.days?.[0]?.date;
  const endDate = itinerary.days?.[itinerary.days.length - 1]?.date;
  const totalPrice = (itinerary.flights?.reduce((sum, f) => sum + (f.total_price || 0), 0) || 0) +
                     (itinerary.hotels?.reduce((sum, h) => sum + (h.total_price || 0), 0) || 0) +
                     (itinerary.activities?.reduce((sum, a) => sum + (a.total_price || 0), 0) || 0) +
                     (itinerary.transfers?.reduce((sum, t) => sum + (t.total_price || 0), 0) || 0);

  return (
    <div className="itinerary-card">
      <div className="card-header">
        <div>
          <h3 className="card-title">{itinerary.title}</h3>
          <p className="card-ref">Ref: {itinerary.reference_number}</p>
        </div>
        <span className="card-badge">Active</span>
      </div>

      <div className="card-content">
        {startDate && endDate && (
          <div className="card-dates">
            {!isNaN(new Date(startDate).getTime())
              ? format(new Date(startDate), 'MMM d')
              : 'TBD'} - {!isNaN(new Date(endDate).getTime())
              ? format(new Date(endDate), 'MMM d, yyyy')
              : 'TBD'}
          </div>
        )}
        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">Travelers</span>
            <span className="stat-value">{itinerary.travelers?.length || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Days</span>
            <span className="stat-value">{itinerary.days?.length || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Activities</span>
            <span className="stat-value">{itinerary.activities?.length || 0}</span>
          </div>
          {totalPrice > 0 && (
            <div className="stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">${totalPrice.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button className="card-action-btn" onClick={onView}>
          <Eye size={16} />
          View
        </button>
        <button className="card-action-btn">
          <Edit size={16} />
          Edit
        </button>
        <button className="card-action-btn">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

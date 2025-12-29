import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plane, 
  Users, 
  MessageSquare, 
  Settings, 
  PlusCircle, 
  Bell, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Bot
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from './StatCard';
import { AlertCard } from './AlertCard';
import { TodaysFlights } from './TodaysFlights';
import { BookingsTable } from './BookingsTable';
import { Button } from './Button';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import { TravelersDirectory } from '../travelers/TravelersDirectory';
import { MessageCenter } from '../messages/MessageCenter';
import { SettingsView } from '../settings/SettingsView';
import '../travelers/TravelersDirectory.css';
import '../messages/MessageCenter.css';
import '../settings/SettingsView.css';
import './Dashboard.css';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

export const TravelWeaverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'bookings' | 'travelers' | 'messages' | 'settings' | 'chat'>('dashboard');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'cancelled'>('all');

  // Fetch bookings
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: async () => {
      try {
        return await api.getBookings(statusFilter === 'all' ? undefined : statusFilter);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        return { bookings: [], total: 0 };
      }
    },
  });

  // Flights for today's departures will be derived from bookings

  const bookings = bookingsData?.bookings || [];
  
  // Active bookings are those with status 'active' or 'confirmed'
  const activeBookings = bookings.filter((b: any) => 
    b.status === 'active' || b.status === 'confirmed'
  );
  
  // Bookings departing this week
  const departingThisWeek = bookings.filter((b: any) => {
    if (!b.start_date) return false;
    const startDate = new Date(b.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return startDate >= today && startDate <= weekFromNow;
  });

  // Calculate revenue for current month
  const revenueThisMonth = bookings.reduce((sum: number, b: any) => {
    if (!b.created_at) return sum;
    const createdDate = new Date(b.created_at);
    const now = new Date();
    // Check if booking was created this month
    if (createdDate.getMonth() === now.getMonth() && 
        createdDate.getFullYear() === now.getFullYear()) {
      return sum + (b.total_price || 0);
    }
    return sum;
  }, 0);

  const stats = {
    active_bookings: activeBookings.length,
    departing_this_week: departingThisWeek.length,
    travelers_in_trip: bookings.reduce((sum: number, b: any) => sum + (b.total_travelers || 1), 0),
    revenue_this_month: revenueThisMonth,
  };

  // Fetch flight monitoring alerts
  const { data: flightsToMonitor, error: flightsError } = useQuery({
    queryKey: ['flightsToMonitor'],
    queryFn: async () => {
      try {
        return await api.getFlightsToMonitor();
      } catch (err) {
        console.error('Error fetching flights to monitor:', err);
        return { flights: [] };
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Generate alerts from flight monitoring data
  const alerts = useMemo(() => {
    const flightAlerts: Array<{
      id: string;
      severity: 'high' | 'medium' | 'low';
      title: string;
      message: string;
      booking_code: string;
    }> = [];

    if (flightsToMonitor?.flights) {
      flightsToMonitor.flights.forEach((flight: any) => {
        if (flight.delay_minutes && flight.delay_minutes > 15) {
          const severity = flight.delay_minutes > 120 ? 'high' : 'medium';
          flightAlerts.push({
            id: `flight-${flight.id}`,
            severity,
            title: `Flight ${flight.carrier_code}${flight.flight_number} Delayed`,
            message: `Delayed by ${flight.delay_minutes} minutes. New departure: ${flight.estimated_departure ? format(new Date(flight.estimated_departure), 'HH:mm') : 'TBD'}`,
            booking_code: flight.booking_code || 'N/A',
          });
        }
        if (flight.status === 'cancelled') {
          flightAlerts.push({
            id: `flight-cancelled-${flight.id}`,
            severity: 'high',
            title: `Flight ${flight.carrier_code}${flight.flight_number} Cancelled`,
            message: 'Flight has been cancelled. Please contact traveler immediately.',
            booking_code: flight.booking_code || 'N/A',
          });
        }
        if (flight.departure_gate && flight.departure_gate !== flight.previous_gate) {
          flightAlerts.push({
            id: `flight-gate-${flight.id}`,
            severity: 'low',
            title: `Gate Change - ${flight.carrier_code}${flight.flight_number}`,
            message: `Gate changed to ${flight.departure_gate}`,
            booking_code: flight.booking_code || 'N/A',
          });
        }
      });
    }

    return flightAlerts;
  }, [flightsToMonitor]);

  // Transform bookings for the table
  const tableBookings = bookings.map((booking: any) => {
    // Get primary traveler - if travelers array exists, use it, otherwise show count
    const primaryTraveler = booking.travelers?.[0] || booking.traveler;
    let travelerName = 'Unknown Traveler';
    
    if (primaryTraveler) {
      if (typeof primaryTraveler === 'object') {
        travelerName = `${primaryTraveler.first_name || ''} ${primaryTraveler.last_name || ''}`.trim() || 'Unknown Traveler';
      } else {
        travelerName = String(primaryTraveler);
      }
    } else if (booking.total_travelers) {
      // If no traveler details but we have count, show generic name
      travelerName = `${booking.total_travelers} Traveler${booking.total_travelers > 1 ? 's' : ''}`;
    }

    // Try to extract destination from title or notes
    let destination = booking.destination || 'N/A';
    if (destination === 'N/A' && booking.title) {
      // Simple extraction: look for common destination keywords
      const title = booking.title.toLowerCase();
      if (title.includes('kenya') || title.includes('masai mara') || title.includes('safari')) {
        destination = 'Kenya';
      } else if (title.includes('mombasa') || title.includes('beach')) {
        destination = 'Mombasa, Kenya';
      } else if (title.includes('mount kenya')) {
        destination = 'Mount Kenya';
      } else {
        // Use title as fallback
        destination = booking.title;
      }
    }

    return {
      id: booking.id || booking.booking_id,
      code: booking.booking_code || booking.code || booking.id,
      title: booking.title,
      traveler: travelerName,
      travelers: booking.total_travelers || booking.travelers?.length || 1,
      start: booking.start_date,
      end: booking.end_date,
      status: booking.status || 'draft',
      price: booking.total_price || 0,
      currency: booking.currency || 'USD',
      destination: destination,
    };
  });

  // Transform flights for today's departures
  const todaysFlights = bookings
    .filter((b: any) => {
      const startDate = new Date(b.start_date);
      const today = new Date();
      return startDate.toDateString() === today.toDateString();
    })
    .slice(0, 3)
    .map((booking: any) => {
      const primaryTraveler = booking.travelers?.[0] || booking.traveler;
      return {
        flight_number: 'KQ123', // This would come from flight data
        time: format(new Date(booking.start_date), 'HH:mm'),
        traveler: primaryTraveler 
          ? `${primaryTraveler.first_name || ''} ${primaryTraveler.last_name || ''}`.trim()
          : 'Unknown',
        destination: booking.destination || 'N/A',
        status: 'scheduled' as const,
        code: booking.booking_code,
        from: 'Nairobi', // This would come from flight data
      };
    });

  const navigation = [
    { id: 'dashboard' as const, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings' as const, name: 'Bookings', icon: Plane },
    { id: 'travelers' as const, name: 'Travelers', icon: Users },
    { id: 'messages' as const, name: 'Messages', icon: MessageSquare },
    { id: 'settings' as const, name: 'Settings', icon: Settings },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleViewBooking = (bookingId: string) => {
    navigate(`/dmc/${bookingId}`);
  };

  const handleSendBooking = (bookingId: string) => {
    // Implement send functionality
    console.log('Send booking:', bookingId);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Sidebar */}
      <div className="flex h-full w-72 flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-sm">
        <div className="flex h-20 items-center px-6 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg">
              <Plane className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">TravelWeaver</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Operations Platform</p>
            </div>
          </div>
        </div>
        
        <div className="p-5 space-y-3">
          <Button 
            variant="primary"
            className="w-full justify-center" 
            size="lg" 
            onClick={() => navigate('/ai-assistant')}
          >
            <Bot className="h-5 w-5" />
            AI Booking Assistant
          </Button>
          <Button 
            variant="secondary"
            className="w-full justify-center" 
            size="lg" 
            onClick={() => {
              // TODO: Open create booking modal or navigate to create page
              alert('Create booking functionality - to be implemented');
            }}
          >
            <PlusCircle className="h-5 w-5" />
            New Booking
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 py-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 relative group',
                  isActive
                    ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn(
                  "transition-all duration-200",
                  isActive && "font-semibold"
                )}>{item.name}</span>
                {isActive && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </nav>
        
        <div className="border-t border-slate-200/60 p-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-bold text-white shadow-md group-hover:shadow-lg transition-shadow">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-slate-500">Organization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-20 items-center justify-between bg-white/60 backdrop-blur-xl px-8 border-b border-slate-200/60 shadow-sm">
          <div className="flex flex-1 items-center gap-6">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search bookings, travelers..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm pl-11 pr-4 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-300 transition-all shadow-sm hover:shadow-md"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-sm text-slate-600 md:block font-medium px-4 py-2 rounded-lg bg-slate-50">
              {currentDate}
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <Settings className="h-5 w-5" strokeWidth={1.5} />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {currentPage === 'dashboard' && (
            <div className="space-y-8 max-w-7xl mx-auto">
              {/* Error Display */}
              {(bookingsError || flightsError) && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800">
                    ⚠️ API Error: {bookingsError?.message || flightsError?.message || 'Failed to load data'}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Check the browser console for more details. Make sure the backend API is running at {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Good morning, {user?.name?.split(' ')[0] || 'User'}! <span className="inline-block animate-bounce">☀️</span>
                </h1>
                <p className="text-slate-500 text-lg">{currentDate}</p>
              </div>

              <div className="stats-grid">
                <StatCard 
                  title="Active Bookings" 
                  value={stats.active_bookings} 
                  icon={Calendar} 
                  trend={{ value: 12, isPositive: true }} 
                />
                <StatCard 
                  title="Departing This Week" 
                  value={stats.departing_this_week} 
                  icon={Plane} 
                />
                <StatCard 
                  title="In-Trip Now" 
                  value={stats.travelers_in_trip} 
                  icon={Users} 
                />
                <StatCard 
                  title="Revenue This Month" 
                  value={formatCurrency(stats.revenue_this_month)} 
                  icon={DollarSign} 
                  trend={{ value: 8, isPositive: true }} 
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <AlertCard alerts={alerts} />
                <TodaysFlights flights={todaysFlights} />
              </div>
            </div>
          )}

          {currentPage === 'bookings' && (
            <div className="space-y-6 max-w-7xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-black">Bookings</h1>
                  <p className="text-gray-500 mt-1">Manage all your travel bookings</p>
                </div>
                <Button onClick={() => {
                  // TODO: Open create booking modal or navigate to create page
                  alert('Create booking functionality - to be implemented');
                }}>
                  <PlusCircle className="h-5 w-5" />
                  Create Booking
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  active={statusFilter === 'all'}
                >
                  <Filter className="h-4 w-4" />
                  All Statuses
                </Button>
                <Button variant="outline" size="sm">All Dates</Button>
                <Button variant="outline" size="sm">All Travelers</Button>
              </div>

              {bookingsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading bookings...</p>
                </div>
              ) : (
                <BookingsTable 
                  bookings={tableBookings}
                  onView={handleViewBooking}
                  onSend={handleSendBooking}
                />
              )}
            </div>
          )}

          {currentPage === 'travelers' && <TravelersDirectory />}

          {currentPage === 'messages' && <MessageCenter />}

          {currentPage === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};


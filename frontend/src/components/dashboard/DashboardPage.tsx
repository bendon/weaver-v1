'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, DollarSign, Users, Plane, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from './StatCard';
import { AlertCard } from './AlertCard';
import { TodaysFlights } from './TodaysFlights';
import { format } from 'date-fns';
import './Dashboard.css';

export function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      try {
        return await api.getBookings();
      } catch (err) {
        console.error('Error fetching bookings:', err);
        return { bookings: [], total: 0 };
      }
    },
  });

  // Fetch flights to monitor
  const { data: flightsData } = useQuery({
    queryKey: ['flightsToMonitor'],
    queryFn: async () => {
      try {
        return await api.getFlightsToMonitor();
      } catch (err) {
        console.error('Error fetching flights:', err);
        return { flights: [] };
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const bookings = bookingsData?.bookings || [];
  const flights = flightsData?.flights || [];

  // Calculate stats
  const activeBookings = bookings.filter((b: any) => 
    b.status === 'active' || b.status === 'confirmed'
  );

  const departingThisWeek = bookings.filter((b: any) => {
    if (!b.start_date) return false;
    const startDate = new Date(b.start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return startDate >= today && startDate <= weekFromNow;
  });

  const travelersInTrip = bookings.reduce((sum: number, b: any) => {
    if (b.status === 'active' || b.status === 'confirmed') {
      return sum + (b.total_travelers || 1);
    }
    return sum;
  }, 0);

  const completedThisMonth = bookings.filter((b: any) => {
    if (b.status !== 'completed') return false;
    if (!b.end_date) return false;
    const endDate = new Date(b.end_date);
    const now = new Date();
    return endDate.getMonth() === now.getMonth() && 
           endDate.getFullYear() === now.getFullYear();
  }).length;

  const revenueThisMonth = bookings.reduce((sum: number, b: any) => {
    if (!b.created_at) return sum;
    const createdDate = new Date(b.created_at);
    const now = new Date();
    if (createdDate.getMonth() === now.getMonth() && 
        createdDate.getFullYear() === now.getFullYear()) {
      return sum + (b.total_price || 0);
    }
    return sum;
  }, 0);

  // Generate alerts from flights
  const alerts = flights
    .filter((f: any) => {
      const status = f.status?.toLowerCase() || '';
      return status.includes('delayed') || status.includes('cancelled') || status.includes('gate');
    })
    .slice(0, 5)
    .map((flight: any) => ({
      id: flight.id || flight.flight_id,
      severity: flight.status?.toLowerCase().includes('cancelled') ? 'high' as const :
                flight.status?.toLowerCase().includes('delayed') ? 'medium' as const : 'low' as const,
      title: `${flight.carrier_code || ''}${flight.flight_number || ''} ${flight.status || 'Status Update'}`,
      message: `Flight ${flight.carrier_code || ''}${flight.flight_number || ''} - ${flight.status || 'Update'}`,
      booking_code: flight.booking_code || 'N/A',
      timestamp: flight.updated_at || new Date().toISOString(),
    }));

  // Today's departures
  const todaysFlights = bookings
    .filter((b: any) => {
      if (!b.start_date) return false;
      const startDate = new Date(b.start_date);
      const today = new Date();
      return startDate.toDateString() === today.toDateString();
    })
    .slice(0, 5)
    .map((booking: any) => {
      const primaryTraveler = booking.travelers?.[0] || booking.traveler;
      const travelerName = primaryTraveler 
        ? `${primaryTraveler.first_name || ''} ${primaryTraveler.last_name || ''}`.trim()
        : 'Unknown';
      
      return {
        id: booking.id || booking.booking_id,
        flight_number: 'TBD', // Would come from flight data
        time: booking.start_date ? format(new Date(booking.start_date), 'HH:mm') : 'TBD',
        traveler: travelerName,
        destination: booking.destination || booking.title || 'N/A',
        status: 'scheduled' as const,
        code: booking.booking_code || booking.id,
        from: 'N/A',
      };
    });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');

  if (bookingsLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h1 className="dashboard-title">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="dashboard-subtitle">{currentDate}</p>
        </div>
        <button
          className="dashboard-new-booking-btn"
          onClick={() => router.push('/bookings/new')}
        >
          <Plus size={20} />
          New Booking
        </button>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard
          title="Active Bookings"
          value={activeBookings.length}
          icon={Calendar}
        />
        <StatCard
          title="Departing This Week"
          value={departingThisWeek.length}
          icon={Plane}
        />
        <StatCard
          title="Travelers In-Trip"
          value={travelersInTrip}
          icon={Users}
        />
        <StatCard
          title="Completed This Month"
          value={completedThisMonth}
          icon={CheckCircle}
        />
        <StatCard
          title="Revenue This Month"
          value={`$${revenueThisMonth.toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      {/* Main Grid */}
      <div className="dashboard-main-grid">
        {/* Left Column */}
        <div className="dashboard-left-column">
          {/* Active Alerts */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">
                <AlertTriangle size={20} />
                Active Alerts
              </h2>
              {alerts.length > 5 && (
                <button className="dashboard-card-link">View all</button>
              )}
            </div>
            <div className="dashboard-alerts-list">
              {alerts.length === 0 ? (
                <div className="dashboard-empty-state">
                  <p>No active alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="alert-item">
                    <div className={`alert-severity-${alert.severity}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div className="alert-content">
                      <div className="alert-header">
                        <span className="alert-badge">{alert.severity.toUpperCase()}</span>
                        <span className="alert-time">{format(new Date(alert.timestamp), 'HH:mm')}</span>
                      </div>
                      <h4 className="alert-title">{alert.title}</h4>
                      <p className="alert-message">{alert.message}</p>
                      <button 
                        className="alert-action"
                        onClick={() => router.push(`/bookings/${alert.booking_code}`)}
                      >
                        View Booking
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">
                <Clock size={20} />
                Recent Activity
              </h2>
            </div>
            <div className="dashboard-activity-list">
              {/* TODO: Implement activity feed */}
              <div className="dashboard-empty-state">
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right-column">
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">
                <Plane size={20} />
                Today's Departures
              </h2>
              <button 
                className="dashboard-card-link"
                onClick={() => router.push('/flights')}
              >
                View All Flights
              </button>
            </div>
            <TodaysFlights flights={todaysFlights} />
          </div>
        </div>
      </div>
    </div>
  );
}


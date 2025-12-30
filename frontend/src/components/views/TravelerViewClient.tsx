'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import {
  Bell, User, Plus, Plane, Globe, Camera, Star,
  Home, Search, Wallet, MapPin, Users as UsersIcon,
  Flame, Key, ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { ItineraryWeaver } from '@/components/itinerary/ItineraryWeaver';
import '../../views/TravelerView.css';

interface TravelerViewClientProps {
  itineraryId?: string;
  bookingCode?: string;
}

export function TravelerViewClient({ itineraryId, bookingCode }: TravelerViewClientProps) {
  const router = useRouter();
  const [codeInput, setCodeInput] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(!itineraryId && !bookingCode);

  // If booking code is provided, fetch public itinerary
  const { data: publicItinerary, isLoading: publicLoading } = useQuery({
    queryKey: ['publicItinerary', bookingCode],
    queryFn: async () => {
      if (!bookingCode) return null;
      try {
        const booking = await api.getPublicItinerary(bookingCode);
        return booking;
      } catch (err) {
        console.error('Error fetching public itinerary:', err);
        return null;
      }
    },
    enabled: !!bookingCode,
  });

  // Regular itinerary fetch
  const { data: itinerary, isLoading: itineraryLoading } = useQuery({
    queryKey: ['itinerary', itineraryId],
    queryFn: async () => {
      if (!itineraryId) return null;
      try {
        return await api.getItinerary(itineraryId);
      } catch (err) {
        return null;
      }
    },
    enabled: !!itineraryId && !bookingCode,
  });

  const { data: itineraries, isLoading } = useQuery({
    queryKey: ['itineraries'],
    queryFn: async () => {
      try {
        return await api.getAllItineraries();
      } catch (err) {
        return [];
      }
    },
    enabled: !itineraryId && !bookingCode && !showCodeInput,
  });

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim().length === 6) {
      router.push(`/traveler/code/${codeInput.toUpperCase()}`);
    }
  };

  // Mock data for stories and stats
  const stories = [
    { id: 1, label: 'Masai Mara', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=200', active: true },
    { id: 2, label: 'Zanzibar', image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=200', active: false },
    { id: 3, label: 'Cape Town', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=200', active: false },
    { id: 4, label: 'Serengeti', image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=200', active: false },
  ];

  const stats = [
    { icon: Plane, value: itineraries?.length || 3, label: 'Trips' },
    { icon: Globe, value: '2', label: 'Countries' },
    { icon: Camera, value: '47', label: 'Memories' },
    { icon: Star, value: '4.9', label: 'Rating' },
  ];

  const trips = (itineraries || []).slice(0, 2).map((itinerary: any, index: number) => {
    const startDate = itinerary.days[0]?.date ? new Date(itinerary.days[0].date) : new Date();
    const daysUntil = differenceInDays(startDate, new Date());
    const progress = index === 0 ? 85 : 40;

    return {
      id: itinerary.itinerary_id,
      title: itinerary.title,
      dates: itinerary.days[0]?.date && itinerary.days[itinerary.days.length - 1]?.date
        ? `${format(new Date(itinerary.days[0].date), 'MMM d')} - ${format(new Date(itinerary.days[itinerary.days.length - 1].date), 'MMM d, yyyy')}`
        : 'Feb 15-20, 2025',
      status: index === 0 ? 'upcoming' : 'planning',
      image: index === 0
        ? 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'
        : 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800',
      daysUntil: daysUntil > 0 ? `${daysUntil}d` : '0d',
      progress,
      travelers: itinerary.travelers?.length || 2,
      destination: itinerary.title.includes('Safari') ? 'Masai Mara' : 'Stone Town',
    };
  });

  // Default trips if none loaded
  const displayTrips = trips.length > 0 ? trips : [
    {
      id: '1',
      title: 'Kenya Safari',
      dates: 'Feb 15-20, 2025',
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
      daysUntil: '52d',
      progress: 85,
      travelers: 2,
      destination: 'Masai Mara',
    },
    {
      id: '2',
      title: 'Zanzibar Vibes',
      dates: 'Mar 10-15, 2025',
      status: 'planning',
      image: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800',
      daysUntil: '75d',
      progress: 40,
      travelers: 4,
      destination: 'Stone Town',
    },
  ];

  const trendingDestinations = [
    'Tanzania',
    'South Africa',
    'Morocco',
    'Egypt',
    'Rwanda',
    'Namibia',
  ];

  // Show booking code input if no itinerary/booking code
  if (showCodeInput) {
    return (
      <div className="app">
        <main className="app-main">
          <div className="view">
            <header className="app-header">
              <div className="header-content">
                <div className="header-left">
                  <h1>View Your Itinerary</h1>
                  <p>Enter your booking code</p>
                </div>
              </div>
            </header>

            <div className="code-input-container">
              <div className="code-input-card">
                <Key size={48} className="code-icon" />
                <h2>Enter Booking Code</h2>
                <p>Enter the 6-character code you received</p>
                <form onSubmit={handleCodeSubmit} className="code-form">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABC123"
                    maxLength={6}
                    className="code-input"
                    autoFocus
                  />
                  <button type="submit" className="code-submit-btn" disabled={codeInput.length !== 6}>
                    <ArrowRight size={20} />
                    View Itinerary
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Use public itinerary if available, otherwise regular itinerary
  const displayItinerary = publicItinerary || itinerary;
  const isLoadingData = publicLoading || itineraryLoading;

  // If booking code is provided, show ItineraryWeaver
  if (bookingCode) {
    return <ItineraryWeaver bookingCode={bookingCode} />;
  }

  // If specific itinerary is selected, show loading or not found
  if (itineraryId && isLoadingData) {
    return (
      <div className="app">
        <main className="app-main">
          <div className="view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <p>Loading itinerary...</p>
          </div>
        </main>
      </div>
    );
  }

  // Main traveler dashboard
  return (
    <div className="app">
      <main className="app-main">
        <div className="view">
          {/* Header */}
          <header className="app-header">
            <div className="header-content">
              <div className="header-left">
                <h1>Your Trips</h1>
                <p>Manage your travel adventures</p>
              </div>
              <div className="header-actions">
                <button className="icon-button">
                  <Bell size={20} />
                </button>
                <button className="icon-button">
                  <User size={20} />
                </button>
              </div>
            </div>
          </header>

          {/* Stories */}
          <div className="stories-container">
            {stories.map((story) => (
              <div key={story.id} className={`story ${story.active ? 'active' : ''}`}>
                <div className="story-image" style={{ backgroundImage: `url(${story.image})` }} />
                <span className="story-label">{story.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <stat.icon size={24} className="stat-icon" />
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trips */}
          <section className="trips-section">
            <div className="section-header">
              <h2>Your Adventures</h2>
              <button className="text-button">
                View All <ArrowRight size={16} />
              </button>
            </div>

            <div className="trips-grid">
              {displayTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="trip-card"
                  onClick={() => router.push(`/traveler/${trip.id}`)}
                >
                  <div className="trip-image" style={{ backgroundImage: `url(${trip.image})` }}>
                    <div className="trip-badge">{trip.status}</div>
                  </div>
                  <div className="trip-content">
                    <h3>{trip.title}</h3>
                    <p className="trip-dates">{trip.dates}</p>
                    <div className="trip-meta">
                      <span className="trip-meta-item">
                        <UsersIcon size={14} />
                        {trip.travelers} travelers
                      </span>
                      <span className="trip-meta-item">
                        <MapPin size={14} />
                        {trip.destination}
                      </span>
                    </div>
                    <div className="trip-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${trip.progress}%` }} />
                      </div>
                      <span className="progress-label">{trip.progress}% complete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trending */}
          <section className="trending-section">
            <div className="section-header">
              <h2>
                <Flame size={20} style={{ marginRight: '8px' }} />
                Trending Destinations
              </h2>
            </div>
            <div className="trending-tags">
              {trendingDestinations.map((dest, index) => (
                <button key={index} className="trending-tag">
                  {dest}
                </button>
              ))}
            </div>
          </section>

          {/* Bottom Navigation */}
          <nav className="bottom-nav">
            <button className="nav-item active">
              <Home size={24} />
              <span>Home</span>
            </button>
            <button className="nav-item">
              <Search size={24} />
              <span>Explore</span>
            </button>
            <button className="nav-item nav-item-add">
              <Plus size={32} />
            </button>
            <button className="nav-item">
              <Wallet size={24} />
              <span>Bookings</span>
            </button>
            <button className="nav-item">
              <User size={24} />
              <span>Profile</span>
            </button>
          </nav>
        </div>
      </main>
    </div>
  );
}

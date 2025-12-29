import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { useBookingFlow } from '../contexts/BookingFlowContext';
import './FlightSearchView.css';

export default function FlightSearchView() {
  const router = useRouter();
  const { selectFlight } = useBookingFlow();

  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    departure_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    return_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    adults: 1,
    children: 0,
    infants: 0,
    cabin_class: 'ECONOMY' as const,
    trip_type: 'round-trip' as 'round-trip' | 'one-way',
  });

  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Airport search
  const searchAirports = async (keyword: string) => {
    if (keyword.length < 2) return [];
    try {
      const result = await api.searchAirports({ keyword });
      return result.data || [];
    } catch (error) {
      console.error('Error searching airports:', error);
      return [];
    }
  };

  const handleOriginChange = async (value: string) => {
    setSearchParams({ ...searchParams, origin: value });
    if (value.length >= 2) {
      const suggestions = await searchAirports(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(true);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationChange = async (value: string) => {
    setSearchParams({ ...searchParams, destination: value });
    if (value.length >= 2) {
      const suggestions = await searchAirports(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  // Flight search
  const { data: flightResults, isLoading, error, refetch } = useQuery({
    queryKey: ['flightSearch', searchParams],
    queryFn: async () => {
      const request = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        departure_date: searchParams.departure_date,
        return_date: searchParams.trip_type === 'round-trip' ? searchParams.return_date : undefined,
        adults: searchParams.adults,
        children: searchParams.children,
        infants: searchParams.infants,
        cabin_class: searchParams.cabin_class,
        max_results: 20,
      };
      return await api.searchFlights(request);
    },
    enabled: false, // Don't auto-search
  });

  const handleSearch = () => {
    if (!searchParams.origin || !searchParams.destination) {
      alert('Please enter origin and destination');
      return;
    }
    refetch();
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;
    const hours = match[1] ? match[1].replace('H', '') : '0';
    const minutes = match[2] ? match[2].replace('M', '') : '0';
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (price: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(parseFloat(price));
  };

  return (
    <div className="flight-search-view">
      <div className="flight-search-container">
        <header className="search-header">
          <button className="back-btn" onClick={() => router.push('/dmc')}>
            ← Back
          </button>
          <h1>Flight Search ✈️</h1>
          <p>Search and book flights with Amadeus</p>
        </header>

        <div className="search-form">
          {/* Trip Type */}
          <div className="form-group trip-type">
            <button
              className={`trip-type-btn ${searchParams.trip_type === 'round-trip' ? 'active' : ''}`}
              onClick={() => setSearchParams({ ...searchParams, trip_type: 'round-trip' })}
            >
              Round Trip
            </button>
            <button
              className={`trip-type-btn ${searchParams.trip_type === 'one-way' ? 'active' : ''}`}
              onClick={() => setSearchParams({ ...searchParams, trip_type: 'one-way' })}
            >
              One Way
            </button>
          </div>

          {/* Origin */}
          <div className="form-group">
            <label>From</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="City or Airport Code"
                value={searchParams.origin}
                onChange={(e) => handleOriginChange(e.target.value)}
                onFocus={() => searchParams.origin.length >= 2 && setShowOriginSuggestions(true)}
                onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
              />
              {showOriginSuggestions && originSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {originSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => {
                        setSearchParams({ ...searchParams, origin: suggestion.iataCode });
                        setShowOriginSuggestions(false);
                      }}
                    >
                      <div className="suggestion-code">{suggestion.iataCode}</div>
                      <div className="suggestion-details">
                        <div className="suggestion-name">{suggestion.name}</div>
                        <div className="suggestion-location">{suggestion.cityName}, {suggestion.countryCode}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="form-group">
            <label>To</label>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="City or Airport Code"
                value={searchParams.destination}
                onChange={(e) => handleDestinationChange(e.target.value)}
                onFocus={() => searchParams.destination.length >= 2 && setShowDestinationSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
              />
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="suggestions-dropdown">
                  {destinationSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => {
                        setSearchParams({ ...searchParams, destination: suggestion.iataCode });
                        setShowDestinationSuggestions(false);
                      }}
                    >
                      <div className="suggestion-code">{suggestion.iataCode}</div>
                      <div className="suggestion-details">
                        <div className="suggestion-name">{suggestion.name}</div>
                        <div className="suggestion-location">{suggestion.cityName}, {suggestion.countryCode}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label>Departure</label>
              <input
                type="date"
                value={searchParams.departure_date}
                onChange={(e) => setSearchParams({ ...searchParams, departure_date: e.target.value })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            {searchParams.trip_type === 'round-trip' && (
              <div className="form-group">
                <label>Return</label>
                <input
                  type="date"
                  value={searchParams.return_date}
                  onChange={(e) => setSearchParams({ ...searchParams, return_date: e.target.value })}
                  min={searchParams.departure_date}
                />
              </div>
            )}
          </div>

          {/* Passengers & Class */}
          <div className="form-row">
            <div className="form-group">
              <label>Passengers</label>
              <div className="passenger-selector">
                <button
                  onClick={() => setSearchParams({ ...searchParams, adults: Math.max(1, searchParams.adults - 1) })}
                  className="passenger-btn"
                >
                  −
                </button>
                <span>{searchParams.adults + searchParams.children + searchParams.infants}</span>
                <button
                  onClick={() => setSearchParams({ ...searchParams, adults: searchParams.adults + 1 })}
                  className="passenger-btn"
                >
                  +
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Cabin Class</label>
              <select
                value={searchParams.cabin_class}
                onChange={(e) => setSearchParams({ ...searchParams, cabin_class: e.target.value as any })}
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <button className="search-btn" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search Flights'}
          </button>
        </div>

        {/* Results */}
        {error && (
          <div className="error-message">
            {error instanceof Error ? error.message : 'Failed to search flights'}
          </div>
        )}

        {flightResults?.data && flightResults.data.length > 0 && (
          <div className="flight-results">
            <h2>Flight Results ({flightResults.data.length})</h2>
            <div className="results-list">
              {flightResults.data.map((offer: any, index: number) => (
                <div key={offer.id || index} className="flight-card">
                  <div className="flight-price">
                    {formatPrice(offer.price?.total || '0', offer.price?.currency || 'USD')}
                  </div>
                  {offer.itineraries?.map((itinerary: any, itinIndex: number) => (
                    <div key={itinIndex} className="itinerary-section">
                      <div className="itinerary-header">
                        {itinIndex === 0 ? 'Outbound' : 'Return'}
                        <span className="duration">{formatDuration(itinerary.duration)}</span>
                      </div>
                      <div className="segments">
                        {itinerary.segments?.map((segment: any, segIndex: number) => (
                          <div key={segIndex} className="segment">
                            <div className="segment-time">
                              <div className="time">{format(new Date(segment.departure.at), 'HH:mm')}</div>
                              <div className="airport">{segment.departure.iataCode}</div>
                            </div>
                            <div className="segment-details">
                              <div className="flight-info">
                                {segment.carrierCode} {segment.number}
                                {segment.aircraft?.code && ` • ${segment.aircraft.code}`}
                              </div>
                              <div className="stops">
                                {segment.numberOfStops === 0 ? 'Nonstop' : `${segment.numberOfStops} stop(s)`}
                              </div>
                            </div>
                            <div className="segment-time">
                              <div className="time">{format(new Date(segment.arrival.at), 'HH:mm')}</div>
                              <div className="airport">{segment.arrival.iataCode}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    className="select-flight-btn"
                    onClick={() => {
                      selectFlight(offer, searchParams);
                      router.push('/bookings/new');
                    }}
                  >
                    Select Flight
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {flightResults?.data && flightResults.data.length === 0 && (
          <div className="no-results">
            <p>No flights found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}


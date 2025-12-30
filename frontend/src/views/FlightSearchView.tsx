'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { useBookingFlow } from '../contexts/BookingFlowContext';
import { ArrowLeft, Plane, Calendar, Users, ChevronDown, ArrowUpDown, Filter, Sparkles, Clock, MapPin } from 'lucide-react';
import './FlightSearchView.css';

type SortOption = 'price' | 'duration' | 'departure';
type FilterOption = 'all' | 'nonstop' | '1stop' | '2+stops';

export default function FlightSearchView() {
  const router = useRouter();
  
  // Get bookingId and editFlightId from URL if present
  const bookingId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('bookingId') : null;
  const editFlightId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('editFlightId') : null;
  
  // Only use BookingFlow if not adding to existing booking
  let selectFlight: ((offer: any, searchParams: any) => void) | null = null;
  try {
    const flow = useBookingFlow();
    selectFlight = flow.selectFlight;
  } catch (e) {
    // BookingFlowContext not available, will handle bookingId flow instead
  }

  // Get initial params from URL if available
  const getUrlParam = (key: string, defaultValue: string) => {
    if (typeof window === 'undefined') return defaultValue;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || defaultValue;
  };

  const [searchParams, setSearchParams] = useState({
    origin: getUrlParam('origin', ''),
    destination: getUrlParam('destination', ''),
    departure_date: getUrlParam('departure_date', format(addDays(new Date(), 7), 'yyyy-MM-dd')),
    return_date: getUrlParam('return_date', format(addDays(new Date(), 14), 'yyyy-MM-dd')),
    adults: parseInt(getUrlParam('adults', '1')),
    children: parseInt(getUrlParam('children', '0')),
    infants: parseInt(getUrlParam('infants', '0')),
    cabin_class: (getUrlParam('cabin_class', 'ECONOMY')) as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
    trip_type: (getUrlParam('trip_type', 'round-trip')) as 'round-trip' | 'one-way',
  });

  const [sortBy, setSortBy] = useState<SortOption>('price');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [expandedFlights, setExpandedFlights] = useState<Set<number>>(new Set());
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

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

  // Fetch flight details if editing
  const { data: flightToEdit } = useQuery({
    queryKey: ['flight', editFlightId],
    queryFn: () => api.getFlight(editFlightId!),
    enabled: !!editFlightId,
  });

  // Load flight details into form when editing
  useEffect(() => {
    if (flightToEdit && editFlightId) {
      const flight = flightToEdit;
      const departureDate = flight.departure_date || flight.scheduled_departure;
      const arrivalDate = flight.scheduled_arrival;
      
      // Determine if round-trip based on flight_type
      const isRoundTrip = flight.flight_type === 'return' || (departureDate && arrivalDate && new Date(arrivalDate) > new Date(departureDate));
      
      setSearchParams({
        origin: flight.departure_airport || flight.origin || '',
        destination: flight.arrival_airport || flight.destination || '',
        departure_date: departureDate ? format(new Date(departureDate), 'yyyy-MM-dd') : format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        return_date: isRoundTrip && arrivalDate ? format(new Date(arrivalDate), 'yyyy-MM-dd') : format(addDays(new Date(), 14), 'yyyy-MM-dd'),
        adults: 1,
        children: 0,
        infants: 0,
        cabin_class: 'ECONOMY' as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
        trip_type: isRoundTrip ? 'round-trip' : 'one-way',
      });
    }
  }, [flightToEdit, editFlightId]);

  // Flight search - don't auto-search, user must click search button
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
        max_results: 50,
      };
      return await api.searchFlights(request);
    },
    enabled: false, // User must click search button
  });

  // Collapse form when results are available
  useEffect(() => {
    if (flightResults?.data && flightResults.data.length > 0) {
      setIsFormCollapsed(true);
    }
  }, [flightResults]);

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  const getTotalDuration = (itinerary: any) => {
    return itinerary.duration || '0h 0m';
  };

  const getStopsCount = (itinerary: any) => {
    if (!itinerary.segments) return 0;
    return itinerary.segments.reduce((total: number, seg: any) => total + (seg.numberOfStops || 0), 0);
  };

  // Sort and filter flights
  const processedFlights = useMemo(() => {
    if (!flightResults?.data) return [];

    let flights = [...flightResults.data];

    // Filter by stops
    if (filterBy !== 'all') {
      flights = flights.filter((offer: any) => {
        const outboundStops = getStopsCount(offer.itineraries?.[0]);
        if (filterBy === 'nonstop') return outboundStops === 0;
        if (filterBy === '1stop') return outboundStops === 1;
        if (filterBy === '2+stops') return outboundStops >= 2;
        return true;
      });
    }

    // Sort flights
    flights.sort((a: any, b: any) => {
      if (sortBy === 'price') {
        const priceA = parseFloat(a.price?.total || '0');
        const priceB = parseFloat(b.price?.total || '0');
        return priceA - priceB;
      }
      if (sortBy === 'duration') {
        const durA = getTotalDuration(a.itineraries?.[0]);
        const durB = getTotalDuration(b.itineraries?.[0]);
        return durA.localeCompare(durB);
      }
      if (sortBy === 'departure') {
        const depA = a.itineraries?.[0]?.segments?.[0]?.departure?.at || '';
        const depB = b.itineraries?.[0]?.segments?.[0]?.departure?.at || '';
        return depA.localeCompare(depB);
      }
      return 0;
    });

    return flights;
  }, [flightResults?.data, sortBy, filterBy]);

  const lowestPrice = useMemo(() => {
    if (!flightResults?.data || flightResults.data.length === 0) return null;
    return Math.min(...flightResults.data.map((f: any) => parseFloat(f.price?.total || '0')));
  }, [flightResults?.data]);

  const handleSelectFlight = async (offer: any) => {
    if (bookingId) {
      // If bookingId is provided, add flight(s) directly to booking
      const outbound = offer.itineraries?.[0];
      const returnItinerary = offer.itineraries?.[1];
      
      const outboundFirst = outbound?.segments?.[0];
      const outboundLast = outbound?.segments?.[outbound?.segments?.length - 1];
      
      const returnFirst = returnItinerary?.segments?.[0];
      const returnLast = returnItinerary?.segments?.[returnItinerary?.segments?.length - 1];

      try {
        // Add outbound flight
        if (outboundFirst && outboundLast) {
          const departureDate = new Date(outboundFirst.departure.at);
          await api.addFlightToBooking(bookingId, {
            carrier_code: outboundFirst.carrierCode,
            flight_number: outboundFirst.number,
            departure_date: departureDate.toISOString().split('T')[0],
            departure_airport: outboundFirst.departure.iataCode,
            arrival_airport: outboundLast.arrival.iataCode,
            scheduled_departure: outboundFirst.departure.at,
            scheduled_arrival: outboundLast.arrival.at,
            flight_type: 'outbound',
            status: 'scheduled',
          });
        }

        // Add return flight if it exists
        if (returnItinerary && returnFirst && returnLast) {
          const returnDepartureDate = new Date(returnFirst.departure.at);
          await api.addFlightToBooking(bookingId, {
            carrier_code: returnFirst.carrierCode,
            flight_number: returnFirst.number,
            departure_date: returnDepartureDate.toISOString().split('T')[0],
            departure_airport: returnFirst.departure.iataCode,
            arrival_airport: returnLast.arrival.iataCode,
            scheduled_departure: returnFirst.departure.at,
            scheduled_arrival: returnLast.arrival.at,
            flight_type: 'return',
            status: 'scheduled',
          });
        }

        // Redirect after both flights are added
        router.push(`/bookings/${bookingId}`);
      } catch (error: any) {
        alert(error.message || 'Failed to add flight(s) to booking');
      }
    } else if (selectFlight) {
      selectFlight(offer, searchParams);
      router.push('/bookings/new');
    } else {
      alert('Unable to process flight selection. Please try again.');
    }
  };

  // Helper to get airport name from code
  const getAirportName = (code: string) => {
    const allSuggestions = [...originSuggestions, ...destinationSuggestions];
    const airport = allSuggestions.find(s => s.iataCode === code);
    return airport ? `${airport.cityName}, ${airport.countryCode}` : code;
  };

  const totalPassengers = searchParams.adults + searchParams.children + searchParams.infants;
  const routeDisplay = searchParams.trip_type === 'round-trip' 
    ? `${searchParams.origin || 'Origin'} → ${searchParams.destination || 'Destination'} → ${searchParams.origin || 'Origin'}`
    : `${searchParams.origin || 'Origin'} → ${searchParams.destination || 'Destination'}`;

  return (
    <div className="flight-search-view">
      <div className="flight-search-container">

        {/* Search Form */}
        <div className={`search-form-card ${isFormCollapsed ? 'collapsed' : ''}`}>
          {isFormCollapsed && (
            <button
              className="expand-form-btn"
              onClick={() => setIsFormCollapsed(false)}
            >
              <ChevronDown size={16} className="rotated" />
              <span>Show Search Form</span>
            </button>
          )}
          <div className={`form-section ${isFormCollapsed ? 'hidden' : ''}`}>
            {/* Trip Type */}
            <div className="trip-type-selector">
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

            {/* Origin & Destination */}
            <div className="route-selector">
              <div className="route-input-group">
                <label>From</label>
                <div className="input-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="City or Airport"
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

              <button 
                className="swap-button"
                onClick={() => setSearchParams({ 
                  ...searchParams, 
                  origin: searchParams.destination, 
                  destination: searchParams.origin 
                })}
              >
                ⇄
              </button>

              <div className="route-input-group">
                <label>To</label>
                <div className="input-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input
                    type="text"
                    placeholder="City or Airport"
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
            </div>

            {/* Dates */}
            <div className="date-selector">
              <div className="date-input-group">
                <label>
                  <Calendar size={16} />
                  Departure
                </label>
                <input
                  type="date"
                  value={searchParams.departure_date}
                  onChange={(e) => setSearchParams({ ...searchParams, departure_date: e.target.value })}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              {searchParams.trip_type === 'round-trip' && (
                <div className="date-input-group">
                  <label>
                    <Calendar size={16} />
                    Return
                  </label>
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
            <div className="options-selector">
              <div className="option-group">
                <label>
                  <Users size={16} />
                  Passengers
                </label>
                <div className="passenger-selector">
                  <button
                    onClick={() => setSearchParams({ ...searchParams, adults: Math.max(1, searchParams.adults - 1) })}
                    className="passenger-btn"
                  >
                    −
                  </button>
                  <span className="passenger-count">{searchParams.adults + searchParams.children + searchParams.infants}</span>
                  <button
                    onClick={() => setSearchParams({ ...searchParams, adults: searchParams.adults + 1 })}
                    className="passenger-btn"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="option-group">
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
              <Plane size={20} />
              {isLoading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {error && (
          <div className="error-message">
            {error instanceof Error ? error.message : 'Failed to search flights'}
          </div>
        )}

        {flightResults?.data && flightResults.data.length > 0 && (
          <>
            {/* Sticky Search Summary Bar */}
            <div className="search-summary-bar">
              <div className="search-summary-content">
                <div className="search-summary-left">
                  <div className="search-summary-route">
                    <Plane size={20} />
                    <div>
                      <p className="search-summary-route-text">{routeDisplay}</p>
                      <p className="search-summary-meta">
                        {searchParams.trip_type === 'round-trip' ? 'Round trip' : 'One way'} • {totalPassengers} {totalPassengers === 1 ? 'traveler' : 'travelers'}
                      </p>
                    </div>
                  </div>
                  <div className="search-summary-divider" />
                  <div className="search-summary-date">
                    <Calendar size={16} />
                    <span>
                      {format(new Date(searchParams.departure_date), 'MMM d')}
                      {searchParams.trip_type === 'round-trip' && ` - ${format(new Date(searchParams.return_date), 'MMM d')}`}
                    </span>
                  </div>
                  <div className="search-summary-passengers">
                    <Users size={16} />
                    <span>{totalPassengers} {totalPassengers === 1 ? 'passenger' : 'passengers'}</span>
                  </div>
                </div>
                <button 
                  className="search-summary-edit-btn"
                  onClick={() => {
                    setIsFormCollapsed(false);
                    // Scroll to top to show search form
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Edit Search
                </button>
              </div>
            </div>

            <div className="flight-results-section">
              {/* Results Header with Sort/Filter */}
              <div className="results-header">
                <div className="results-title">
                  <h1>{processedFlights.length} Flights Found</h1>
                  <p>Sorted by {sortBy === 'price' ? 'Price' : sortBy === 'duration' ? 'Duration' : 'Departure Time'}</p>
                </div>

                <div className="results-controls">
                  <div className="filter-group">
                    <Filter size={16} />
                    <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as FilterOption)}>
                      <option value="all">All Flights</option>
                      <option value="nonstop">Nonstop Only</option>
                      <option value="1stop">1 Stop</option>
                      <option value="2+stops">2+ Stops</option>
                    </select>
                  </div>
                  <div className="sort-group">
                    <ArrowUpDown size={16} />
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
                      <option value="price">Price</option>
                      <option value="duration">Duration</option>
                      <option value="departure">Departure</option>
                    </select>
                  </div>
                </div>
              </div>

            {/* Flight Cards - Improved Design */}
            <div className="flight-results-list">
              {processedFlights.map((offer: any, index: number) => {
                const price = parseFloat(offer.price?.total || '0');
                const isBestPrice = lowestPrice && price === lowestPrice;
                const isExpanded = expandedFlights.has(index);
                const outbound = offer.itineraries?.[0];
                const returnItinerary = offer.itineraries?.[1];
                
                // Get first and last segments for summary
                const outboundFirst = outbound?.segments?.[0];
                const outboundLast = outbound?.segments?.[outbound?.segments?.length - 1];
                const returnFirst = returnItinerary?.segments?.[0];
                const returnLast = returnItinerary?.segments?.[returnItinerary?.segments?.length - 1];
                const totalStops = outbound ? outbound.segments.reduce((sum: number, seg: any) => sum + (seg.numberOfStops || 0), 0) : 0;
                const returnStops = returnItinerary ? returnItinerary.segments.reduce((sum: number, seg: any) => sum + (seg.numberOfStops || 0), 0) : 0;

                // Get airline name from carrier code
                const getAirlineName = (carrierCode: string) => {
                  // This could be enhanced with an airline lookup
                  return carrierCode || 'Airline';
                };

                return (
                  <div key={offer.id || index} className="flight-card-improved">
                    {/* Main Flight Card */}
                    <div className="flight-card-main">
                      {/* Best Price Indicator */}
                      {isBestPrice && (
                        <div className="best-price-badge">
                          <Sparkles size={12} />
                          Best Price
                        </div>
                      )}

                      <div className="flight-card-content">
                        {/* Flights Section */}
                        <div className="flight-legs-section">
                          {/* Outbound Flight */}
                          {outbound && outboundFirst && outboundLast && (
                            <div className="flight-leg-row">
                              <div className="flight-time-airport">
                                <div className="flight-time-large">{format(new Date(outboundFirst.departure.at), 'HH:mm')}</div>
                                <div className="flight-airport-code">{outboundFirst.departure.iataCode}</div>
                              </div>

                              <div className="flight-connector">
                                <div className="connector-line" />
                                <div className="connector-info">
                                  <div className="connector-flight-number">{outboundFirst.carrierCode} {outboundFirst.number}</div>
                                  <div className="connector-duration">
                                    <Clock size={12} />
                                    {formatDuration(outbound.duration)}
                                  </div>
                                  <div className="connector-stops">
                                    {totalStops === 0 ? 'Direct' : `${totalStops} stop${totalStops > 1 ? 's' : ''}`}
                                  </div>
                                </div>
                                <div className="connector-line" />
                              </div>

                              <div className="flight-time-airport">
                                <div className="flight-time-large">
                                  {format(new Date(outboundLast.arrival.at), 'HH:mm')}
                                  {new Date(outboundLast.arrival.at).getDate() !== new Date(outboundFirst.departure.at).getDate() && '+1'}
                                </div>
                                <div className="flight-airport-code">{outboundLast.arrival.iataCode}</div>
                              </div>
                            </div>
                          )}

                          {/* Arrow Separator */}
                          {returnItinerary && returnFirst && returnLast && (
                            <div className="flight-separator-arrow">
                              <div className="separator-circle">
                                <span>↓</span>
                              </div>
                            </div>
                          )}

                          {/* Return Flight */}
                          {returnItinerary && returnFirst && returnLast && (
                            <div className="flight-leg-row">
                              <div className="flight-time-airport">
                                <div className="flight-time-large">{format(new Date(returnFirst.departure.at), 'HH:mm')}</div>
                                <div className="flight-airport-code">{returnFirst.departure.iataCode}</div>
                              </div>

                              <div className="flight-connector">
                                <div className="connector-line" />
                                <div className="connector-info">
                                  <div className="connector-flight-number">{returnFirst.carrierCode} {returnFirst.number}</div>
                                  <div className="connector-duration">
                                    <Clock size={12} />
                                    {formatDuration(returnItinerary.duration)}
                                  </div>
                                  <div className="connector-stops">
                                    {returnStops === 0 ? 'Direct' : `${returnStops} stop${returnStops > 1 ? 's' : ''}`}
                                  </div>
                                </div>
                                <div className="connector-line" />
                              </div>

                              <div className="flight-time-airport">
                                <div className="flight-time-large">
                                  {format(new Date(returnLast.arrival.at), 'HH:mm')}
                                  {new Date(returnLast.arrival.at).getDate() !== new Date(returnFirst.departure.at).getDate() && '+1'}
                                </div>
                                <div className="flight-airport-code">{returnLast.arrival.iataCode}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Price Section */}
                        <div className="flight-price-section">
                          <div className="price-display">
                            <div className="price-amount-large">{formatPrice(offer.price?.total || '0', offer.price?.currency || 'USD')}</div>
                            <div className="price-label-text">per person</div>
                          </div>
                          <button
                            className="select-flight-btn"
                            onClick={() => handleSelectFlight(offer)}
                          >
                            Select
                          </button>
                        </div>
                      </div>

                      {/* Toggle Details */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedFlights);
                          if (newExpanded.has(index)) {
                            newExpanded.delete(index);
                          } else {
                            newExpanded.add(index);
                          }
                          setExpandedFlights(newExpanded);
                        }}
                        className="flight-details-toggle-btn"
                      >
                        <ChevronDown size={16} className={isExpanded ? 'rotated' : ''} />
                        <span>{isExpanded ? 'Hide details' : 'View details'}</span>
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="flight-details-expanded-improved">
                        <div className="details-grid">
                          {/* Outbound Details */}
                          {outbound && (
                            <div className="details-column">
                              <h3 className="details-column-title">Outbound Flight Details</h3>
                              <div className="details-content">
                                <div className="airline-info">
                                  <div className="airline-icon">
                                    <Plane size={20} />
                                  </div>
                                  <div className="airline-details">
                                    <div className="airline-name">{getAirlineName(outboundFirst?.carrierCode)}</div>
                                    <div className="airline-meta">
                                      {outboundFirst?.carrierCode} {outboundFirst?.number}
                                      {outboundFirst?.aircraft && ` • ${outboundFirst.aircraft.code || ''}`}
                                    </div>
                                    <div className="airline-class">
                                      {searchParams.cabin_class.replace('_', ' ')} • 2 x 23kg
                                    </div>
                                  </div>
                                </div>

                                <div className="flight-timeline">
                                  {outbound.segments?.map((segment: any, segIndex: number) => {
                                    const isLast = segIndex === outbound.segments.length - 1;
                                    const nextSegment = !isLast ? outbound.segments[segIndex + 1] : null;
                                    const layoverDuration = nextSegment ? 
                                      Math.round((new Date(nextSegment.departure.at).getTime() - new Date(segment.arrival.at).getTime()) / (1000 * 60)) : 0;

                                    return (
                                      <div key={segIndex} className="timeline-item">
                                        <div className="timeline-point">
                                          <div className="timeline-time">{format(new Date(segment.departure.at), 'HH:mm')}</div>
                                          <div className="timeline-location">
                                            {getAirportName(segment.departure.iataCode)} ({segment.departure.iataCode})
                                          </div>
                                          <div className="timeline-label">Departure</div>
                                        </div>

                                        {!isLast && layoverDuration > 0 && (
                                          <div className="timeline-layover">
                                            ⏱️ {Math.floor(layoverDuration / 60)}h {layoverDuration % 60}m layover in {segment.arrival.iataCode}
                                          </div>
                                        )}

                                        {isLast && (
                                          <div className="timeline-point">
                                            <div className="timeline-time">{format(new Date(segment.arrival.at), 'HH:mm')}</div>
                                            <div className="timeline-location">
                                              {getAirportName(segment.arrival.iataCode)} ({segment.arrival.iataCode})
                                            </div>
                                            <div className="timeline-label">Arrival</div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Return Details */}
                          {returnItinerary && (
                            <div className="details-column">
                              <h3 className="details-column-title">Return Flight Details</h3>
                              <div className="details-content">
                                <div className="airline-info">
                                  <div className="airline-icon">
                                    <Plane size={20} />
                                  </div>
                                  <div className="airline-details">
                                    <div className="airline-name">{getAirlineName(returnFirst?.carrierCode)}</div>
                                    <div className="airline-meta">
                                      {returnFirst?.carrierCode} {returnFirst?.number}
                                      {returnFirst?.aircraft && ` • ${returnFirst.aircraft.code || ''}`}
                                    </div>
                                    <div className="airline-class">
                                      {searchParams.cabin_class.replace('_', ' ')} • 2 x 23kg
                                    </div>
                                  </div>
                                </div>

                                <div className="flight-timeline">
                                  {returnItinerary.segments?.map((segment: any, segIndex: number) => {
                                    const isLast = segIndex === returnItinerary.segments.length - 1;
                                    const nextSegment = !isLast ? returnItinerary.segments[segIndex + 1] : null;
                                    const layoverDuration = nextSegment ? 
                                      Math.round((new Date(nextSegment.departure.at).getTime() - new Date(segment.arrival.at).getTime()) / (1000 * 60)) : 0;

                                    return (
                                      <div key={segIndex} className="timeline-item">
                                        <div className="timeline-point">
                                          <div className="timeline-time">{format(new Date(segment.departure.at), 'HH:mm')}</div>
                                          <div className="timeline-location">
                                            {getAirportName(segment.departure.iataCode)} ({segment.departure.iataCode})
                                          </div>
                                          <div className="timeline-label">Departure</div>
                                        </div>

                                        {!isLast && layoverDuration > 0 && (
                                          <div className="timeline-layover">
                                            ⏱️ {Math.floor(layoverDuration / 60)}h {layoverDuration % 60}m layover in {segment.arrival.iataCode}
                                          </div>
                                        )}

                                        {isLast && (
                                          <div className="timeline-point">
                                            <div className="timeline-time">{format(new Date(segment.arrival.at), 'HH:mm')}</div>
                                            <div className="timeline-location">
                                              {getAirportName(segment.arrival.iataCode)} ({segment.arrival.iataCode})
                                            </div>
                                            <div className="timeline-label">Arrival</div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </>
        )}

        {flightResults?.data && flightResults.data.length === 0 && (
          <div className="no-results">
            <Plane size={48} />
            <h3>No flights found</h3>
            <p>Try adjusting your search criteria or dates</p>
          </div>
        )}
      </div>
    </div>
  );
}

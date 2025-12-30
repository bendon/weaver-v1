import type { Itinerary } from '../types';
import { isAuthError, extractErrorMessage } from '../utils/apiErrorHandler';

// Use relative URLs in development to leverage Next.js proxy, or use env variable for production
// In browser, use empty string to leverage Next.js rewrites, or use env variable if set
// On server, use env variable or default to localhost:8000
const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || '') 
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

// Global auth error handler
let onAuthError: (() => void) | null = null;

export function setAuthErrorHandler(handler: () => void) {
  onAuthError = handler;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper to create headers with auth token
function createHeaders(includeAuth: boolean = true, customHeaders: Record<string, string> = {}): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

// Helper function to handle API responses with auth error detection
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      detail: `HTTP ${response.status}: ${response.statusText}` 
    }));
    
    // Check if it's an authentication error
    if (response.status === 401 || isAuthError(errorData)) {
      // Trigger global auth error handler
      if (onAuthError) {
        onAuthError();
      }
      throw new Error(errorData.detail || 'Your session has expired. Please login again.');
    }
    
    throw new Error(extractErrorMessage(errorData));
  }
  
  return response.json();
}

// Request/Response types
interface CompileItineraryRequest {
  reference_number: string;
  title: string;
  description?: string;
  travelers?: any[];
  flights?: any[];
  hotels?: any[];
  transfers?: any[];
  activities?: any[];
  branding?: any;
}

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults?: number;
  children?: number;
  infants?: number;
  max_results?: number;
  cabin_class?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonstop?: boolean;
}

interface FlightSearchResponse {
  success: boolean;
  data?: any[];
  meta?: any;
  error?: string;
}

interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
      duration: string;
      numberOfStops: number;
    }>;
  }>;
  numberOfBookableSeats?: number;
}

interface HotelSearchRequest {
  city_code: string;
  check_in_date: string;
  check_out_date: string;
  adults?: number;
  room_quantity?: number;
  price_range?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  ratings?: number[];
}

interface HotelSearchResponse {
  success: boolean;
  data?: any[];
  meta?: any;
  error?: string;
}

interface AirportSearchRequest {
  keyword: string;
  sub_type?: 'AIRPORT' | 'CITY';
}

interface PNRImportRequest {
  pnr: string;
  airline_code?: string;
}

interface FlightBookingRequest {
  offer_id: string;
  travelers: Array<{
    id: string;
    dateOfBirth: string;
    name: {
      firstName: string;
      lastName: string;
    };
    contact: {
      emailAddress: string;
      phones: Array<{
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }>;
    };
    documents?: Array<{
      documentType: string;
      birthPlace: string;
      issuanceLocation: string;
      issuanceDate: string;
      number: string;
      expiryDate: string;
      issuanceCountry: string;
      validityCountry: string;
      nationality: string;
      holder: boolean;
    }>;
  }>;
}

interface FormatResponse {
  content: string;
  format: string;
}

export const api = {
  /**
   * Compile travel components into a structured itinerary
   * POST /api/itineraries/compile
   */
  async compileItinerary(request: CompileItineraryRequest): Promise<Itinerary> {
    const response = await fetch(`${API_BASE_URL}/api/itineraries/compile`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(request),
    });
    return handleApiResponse(response);
  },

  /**
   * Get itinerary in a specific format (whatsapp, html, json)
   * POST /api/itineraries/{id}/format/{type}
   */
  async getItineraryFormat(
    itineraryId: string,
    formatType: 'whatsapp' | 'html' | 'json',
    request: CompileItineraryRequest
  ): Promise<FormatResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/itineraries/${itineraryId}/format/${formatType}`,
      {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(request),
      }
    );
    return handleApiResponse(response);
  },

  /**
   * Search for flights using Amadeus API
   */
  async searchFlights(request: FlightSearchRequest): Promise<FlightSearchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/flights/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to search flights' }));
      throw new Error(error.error || error.detail || 'Failed to search flights');
    }
    return response.json();
  },

  /**
   * Get flight offer details
   */
  async getFlightOffer(offerId: string): Promise<FlightOffer> {
    const response = await fetch(`${API_BASE_URL}/api/flights/offers/${offerId}`);
    if (!response.ok) {
      throw new Error('Failed to get flight offer');
    }
    return response.json();
  },

  /**
   * Convert an Amadeus flight offer to FlightBooking format
   */
  async convertAmadeusOffer(request: {
    offer: any;
    booking_id: string;
    pnr: string;
    traveler_ids: string[];
    source_gds?: string;
  }): Promise<{ success: boolean; flight_booking: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/convert-amadeus-offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to convert offer' }));
      throw new Error(error.error || error.detail || 'Failed to convert offer');
    }
    return response.json();
  },

  /**
   * Price a flight offer to get confirmed pricing
   */
  async priceFlightOffer(request: { flight_offer: any }): Promise<{ success: boolean; priced_offer: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/price-offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to price offer' }));
      throw new Error(error.error || error.detail || 'Failed to price offer');
    }
    return response.json();
  },

  /**
   * Create a flight booking with Amadeus
   */
  async createFlightBooking(request: {
    flight_offer: any;
    travelers: Array<{
      id: string;
      dateOfBirth: string;
      name: {
        firstName: string;
        lastName: string;
      };
      gender?: 'MALE' | 'FEMALE';
      contact: {
        emailAddress: string;
        phones: Array<{
          deviceType: string;
          countryCallingCode: string;
          number: string;
        }>;
      };
      documents?: Array<{
        documentType: string;
        number: string;
        expiryDate: string;
        issuanceCountry: string;
        validityCountry: string;
        nationality: string;
        holder: boolean;
      }>;
    }>;
    contacts: Array<{
      addresseeName: {
        firstName: string;
        lastName: string;
      };
      companyName?: string;
      purpose: string;
      phones: Array<{
        deviceType: string;
        countryCallingCode: string;
        number: string;
      }>;
      emailAddress: string;
    }>;
  }): Promise<{ success: boolean; order_id: string; pnr: string; booking_data: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/create-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create booking' }));
      throw new Error(error.error || error.detail || 'Failed to create booking');
    }
    return response.json();
  },

  /**
   * Get flight booking by Amadeus order ID
   */
  async getFlightBooking(orderId: string): Promise<{ success: boolean; order_id: string; pnr: string; booking_data: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/booking/${orderId}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get booking' }));
      throw new Error(error.error || error.detail || 'Failed to get booking');
    }
    return response.json();
  },

  /**
   * Get flight booking by PNR
   */
  async getFlightBookingByPNR(pnr: string): Promise<{ success: boolean; order_id: string; pnr: string; booking_data: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/booking/pnr/${pnr}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get booking' }));
      throw new Error(error.error || error.detail || 'Failed to get booking');
    }
    return response.json();
  },

  /**
   * Sync flight booking status from Amadeus
   */
  async syncFlightBooking(orderId: string): Promise<{ success: boolean; order_id: string; pnr: string; booking_data: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/booking/${orderId}/sync`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to sync booking' }));
      throw new Error(error.error || error.detail || 'Failed to sync booking');
    }
    return response.json();
  },

  /**
   * Cancel a flight booking by Amadeus order ID
   */
  async cancelFlightBooking(orderId: string): Promise<{ success: boolean; order_id: string; booking_data: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/booking/${orderId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to cancel booking' }));
      throw new Error(error.error || error.detail || 'Failed to cancel booking');
    }
    return response.json();
  },

  /**
   * Book a flight using Amadeus API (legacy method - use createFlightBooking instead)
   * @deprecated Use createFlightBooking instead
   */
  async bookFlight(request: FlightBookingRequest): Promise<{ success: boolean; booking?: any; error?: string }> {
    // Legacy method - redirect to new endpoint if possible
    console.warn('bookFlight is deprecated, use createFlightBooking instead');
    const response = await fetch(`${API_BASE_URL}/api/flights/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to book flight' }));
      throw new Error(error.error || error.detail || 'Failed to book flight');
    }
    return response.json();
  },

  /**
   * Search for hotels using Amadeus API
   */
  async searchHotels(request: HotelSearchRequest): Promise<HotelSearchResponse> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to search hotels' }));
      throw new Error(error.error || error.detail || 'Failed to search hotels');
    }
    return response.json();
  },

  /**
   * Get hotel offer details
   */
  async getHotelOffer(hotelId: string, offerId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}/offers/${offerId}`);
    if (!response.ok) {
      throw new Error('Failed to get hotel offer');
    }
    return response.json();
  },

  /**
   * Book a hotel using Amadeus API
   */
  async bookHotel(request: {
    hotel_id: string;
    offer_id: string;
    guests: Array<{
      name: {
        title: string;
        firstName: string;
        lastName: string;
      };
      contact: {
        phone: string;
        email: string;
      };
    }>;
    payments?: any[];
  }): Promise<{ success: boolean; booking?: any; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to book hotel' }));
      throw new Error(error.error || error.detail || 'Failed to book hotel');
    }
    return response.json();
  },

  /**
   * Search for airports/cities using Amadeus API
   */
  async searchAirports(request: AirportSearchRequest): Promise<{ data: Array<{ iataCode: string; name: string; cityName: string; countryCode: string }> }> {
    const response = await fetch(`${API_BASE_URL}/api/airports/search`, {
      method: 'POST',
      headers: createHeaders(), // Include auth token
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error('Failed to search airports');
    }
    return response.json();
  },

  /**
   * Import PNR from Amadeus
   */
  async importPNR(request: PNRImportRequest): Promise<{ success: boolean; booking?: any; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/pnr/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to import PNR' }));
      throw new Error(error.error || error.detail || 'Failed to import PNR');
    }
    return response.json();
  },

  /**
   * Get PNR details
   */
  async getPNR(pnr: string, airlineCode?: string): Promise<any> {
    const params = new URLSearchParams({ pnr });
    if (airlineCode) params.append('airline_code', airlineCode);
    const response = await fetch(`${API_BASE_URL}/api/pnr?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to get PNR');
    }
    return response.json();
  },

  /**
   * Test Amadeus API connection
   */
  async testAmadeus(): Promise<{ success: boolean; message?: string; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/amadeus/test`);
    return response.json();
  },

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; version: string; amadeus_connected: boolean }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  },

  /**
   * Authentication: Login
   */
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: createHeaders(false), // Don't include auth token for login
      body: JSON.stringify({ email, password }),
    });
    return handleApiResponse(response);
  },

  /**
   * Authentication: Register
   */
  async register(email: string, password: string, name: string, organization_name: string): Promise<{ token: string; user: any }> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: createHeaders(false), // Don't include auth token for register
      body: JSON.stringify({ email, password, name, organization_name }),
    });
    return handleApiResponse(response);
  },

  /**
   * Authentication: Get current user
   */
  async getCurrentUser(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Travelers: Get all travelers
   */
  async getTravelers(): Promise<{ travelers: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/travelers`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Travelers: Create traveler
   */
  async createTraveler(first_name: string, last_name: string, phone: string, email?: string, phone_country_code?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/travelers`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ first_name, last_name, phone, email, phone_country_code }),
    });
    return handleApiResponse(response);
  },

  /**
   * Travelers: Get traveler by ID
   */
  async getTraveler(traveler_id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/travelers/${traveler_id}`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Travelers: Update traveler
   */
  async updateTraveler(traveler_id: string, data: Partial<{ first_name: string; last_name: string; phone: string; email: string }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/travelers/${traveler_id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Create booking
   */
  async createBooking(title: string, start_date: string, end_date: string, total_travelers?: number, notes?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ title, start_date, end_date, total_travelers, notes }),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Get all bookings
   * GET /api/bookings?status={status}
   */
  async getBookings(status?: string): Promise<{ bookings: any[]; total: number }> {
    const url = status 
      ? `${API_BASE_URL}/api/bookings?status=${status}`
      : `${API_BASE_URL}/api/bookings`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bookings API error:', errorText);
      throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return { bookings: data, total: data.length };
    }
    // If it's already an object with bookings array
    if (data.bookings) {
      return { bookings: data.bookings, total: data.total || data.bookings.length };
    }
    // If it's an object but no bookings key, assume it's a single booking
    return { bookings: [data], total: 1 };
  },

  /**
   * Bookings: Get booking by ID
   */
  async getBooking(booking_id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Update booking
   */
  async updateBooking(booking_id: string, data: Partial<{ title: string; status: string; start_date: string; end_date: string; notes: string }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Delete booking
   */
  async deleteBooking(booking_id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Link traveler to booking
   */
  async linkTravelerToBooking(booking_id: string, traveler_id: string, is_primary: boolean = false): Promise<{ success: boolean; link_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}/travelers`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ traveler_id, is_primary }),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Get booking travelers
   */
  async getBookingTravelers(booking_id: string): Promise<{ travelers: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}/travelers`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Send itinerary to traveler
   */
  async sendItinerary(booking_id: string): Promise<{ success: boolean; message: string; booking_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}/send`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Bookings: Get booking messages
   */
  async getBookingMessages(booking_id: string): Promise<{ messages: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}/messages`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Add flight to booking
   */
  async addFlightToBooking(booking_id: string, flightData: {
    carrier_code: string;
    flight_number: string;
    departure_date: string;
    departure_airport: string;
    arrival_airport: string;
    scheduled_departure: string;
    scheduled_arrival: string;
    flight_type?: string;
    [key: string]: any;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}/flights`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(flightData),
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Get booking flights
   */
  async getBookingFlights(booking_id: string): Promise<{ flights: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${booking_id}/flights`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Get flight by ID
   * GET /api/flights/{flight_id}
   */
  async getFlight(flight_id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/flights/${flight_id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Update flight
   * PUT /api/flights/{flight_id}
   */
  async updateFlight(flight_id: string, data: Partial<{
    status: string;
    estimated_departure: string;
    estimated_arrival: string;
    departure_gate: string;
    arrival_gate: string;
    delay_minutes: number;
  }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/flights/${flight_id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Delete flight
   * DELETE /api/flights/{flight_id}
   */
  async deleteFlight(flight_id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/${flight_id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Refresh flight status from Amadeus
   * POST /api/flights/{flight_id}/refresh
   */
  async refreshFlightStatus(flight_id: string): Promise<{ success: boolean; flight_id: string; status_data: any }> {
    const response = await fetch(`${API_BASE_URL}/api/flights/${flight_id}/refresh`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Hotels: Add hotel to booking
   * POST /api/hotels/bookings/{booking_id}/hotels
   */
  async addHotelToBooking(booking_id: string, hotelData: {
    hotel_name: string;
    check_in_date: string;
    check_out_date: string;
    [key: string]: any;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/bookings/${booking_id}/hotels`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(hotelData),
    });
    return handleApiResponse(response);
  },

  /**
   * Hotels: Get booking hotels
   * GET /api/hotels/bookings/{booking_id}/hotels
   */
  async getBookingHotels(booking_id: string): Promise<{ hotels: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/bookings/${booking_id}/hotels`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Hotels: Get hotel by ID
   */
  async getHotel(hotel_id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/${hotel_id}`, {
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Hotels: Update hotel
   */
  async updateHotel(hotel_id: string, data: Partial<{
    hotel_name: string;
    confirmation_number: string;
    check_in_time: string;
    check_out_time: string;
    room_type: string;
    price: number;
  }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/${hotel_id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  /**
   * Hotels: Delete hotel
   */
  async deleteHotel(hotel_id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/hotels/${hotel_id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Transfers: Add transfer to booking
   * POST /api/transfers/bookings/{booking_id}/transfers
   */
  async addTransferToBooking(booking_id: string, transferData: {
    scheduled_datetime: string;
    from_location: string;
    to_location: string;
    [key: string]: any;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/transfers/bookings/${booking_id}/transfers`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(transferData),
    });
    return handleApiResponse(response);
  },

  /**
   * Transfers: Get booking transfers
   * GET /api/transfers/bookings/{booking_id}/transfers
   */
  async getBookingTransfers(booking_id: string): Promise<{ transfers: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/transfers/bookings/${booking_id}/transfers`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Transfers: Update transfer
   */
  async updateTransfer(transfer_id: string, data: Partial<{
    scheduled_datetime: string;
    driver_name: string;
    driver_phone: string;
  }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/transfers/${transfer_id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  /**
   * Transfers: Delete transfer
   */
  async deleteTransfer(transfer_id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/transfers/${transfer_id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Activities: Add activity to booking
   * POST /api/activities/bookings/{booking_id}/activities
   */
  async addActivityToBooking(booking_id: string, activityData: {
    activity_name: string;
    scheduled_datetime: string;
    [key: string]: any;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/activities/bookings/${booking_id}/activities`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(activityData),
    });
    return handleApiResponse(response);
  },

  /**
   * Activities: Get booking activities
   * GET /api/activities/bookings/{booking_id}/activities
   */
  async getBookingActivities(booking_id: string): Promise<{ activities: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/activities/bookings/${booking_id}/activities`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Activities: Update activity
   */
  async updateActivity(activity_id: string, data: Partial<{
    activity_name: string;
    scheduled_datetime: string;
    duration_minutes: number;
    location: string;
  }>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/activities/${activity_id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleApiResponse(response);
  },

  /**
   * Activities: Delete activity
   */
  async deleteActivity(activity_id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/activities/${activity_id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Public: Get itinerary by booking code
   * GET /api/public/itinerary/{booking_code}
   */
  async getPublicItinerary(booking_code: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/public/itinerary/${booking_code}`, {
      method: 'GET',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Itinerary not found' }));
      throw new Error(error.detail || 'Itinerary not found');
    }
    return response.json();
  },

  /**
   * Get booking by code (alternative endpoint)
   * GET /api/bookings/code/{booking_code}
   */
  async getBookingByCode(booking_code: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/bookings/code/${booking_code}`, {
      method: 'GET',
    });
    return handleApiResponse(response);
  },

  /**
   * Get a specific itinerary by ID
   * GET /api/itineraries/{id}
   */
  async getItinerary(itineraryId: string): Promise<Itinerary> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itineraries/${itineraryId}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Fallback to demo itinerary if not found
          console.log(`Itinerary ${itineraryId} not found, using demo data`);
          return this.getDemoItinerary();
        }
        // Log as warning since we'll fallback to demo data
        console.warn(`API unavailable (${response.status}), using demo data`);
        return this.getDemoItinerary();
      }
      return response.json();
    } catch (error) {
      // Only log network errors as warnings since we have a fallback
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('API connection unavailable, using demo data');
      } else {
        console.warn('Error fetching itinerary, using demo data:', error);
      }
      // Fallback to demo itinerary
      try {
        return await this.getDemoItinerary();
      } catch (fallbackError) {
        // Only log as error if fallback also fails
        console.error('Failed to load demo data:', fallbackError);
        throw fallbackError;
      }
    }
  },

  /**
   * Get all itineraries
   * GET /api/itineraries
   * Returns an array of itineraries directly
   */
  async getAllItineraries(): Promise<Itinerary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itineraries`, {
        method: 'GET',
        headers: createHeaders(),
      });
      
      if (!response.ok) {
        // Log as warning since we'll fallback to demo data
        console.warn(`API unavailable (${response.status}), using demo data`);
        const demo = await this.getDemoItinerary();
        return [demo];
      }
      
      const data = await response.json();
      
      // Handle both array and object responses
      let itineraries: Itinerary[];
      if (Array.isArray(data)) {
        itineraries = data;
      } else if (data.itineraries && Array.isArray(data.itineraries)) {
        itineraries = data.itineraries;
      } else {
        // Single itinerary object
        itineraries = [data];
      }
      
      // If no itineraries, return demo itinerary
      if (itineraries.length === 0) {
        console.log('No itineraries found, using demo data');
        const demo = await this.getDemoItinerary();
        return [demo];
      }
      
      return itineraries;
    } catch (error) {
      // Only log network errors as warnings since we have a fallback
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        console.warn('API connection unavailable, using demo data');
      } else {
        console.warn('Error fetching itineraries, using demo data:', error);
      }
      // Fallback to demo itinerary
      try {
        const demo = await this.getDemoItinerary();
        return [demo];
      } catch (fallbackError) {
        // Only log as error if fallback also fails
        console.error('Failed to load demo data:', fallbackError);
        throw fallbackError;
      }
    }
  },

  /**
   * Delete an itinerary by ID
   * DELETE /api/itineraries/{id}
   */
  async deleteItinerary(itineraryId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/itineraries/${itineraryId}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  async updateItinerary(_itineraryId: string, _data: Partial<Itinerary>): Promise<Itinerary> {
    // This endpoint doesn't exist yet
    throw new Error('Not implemented');
  },

  /**
   * AI Chat: Send message to AI assistant
   * POST /api/chat/message
   */
  async sendChatMessage(conversation_id: string | null, message: string): Promise<{
    conversation_id: string;
    message_id: string;
    response: string;
    tool_calls?: Array<{
      name: string;
      arguments: any;
      result?: any;
    }>;
  }> {
    const url = `${API_BASE_URL}/api/chat/message`;
    const payload = { 
      message,
      conversation_id: conversation_id || null 
    };
    
    console.log('sendChatMessage - Making request:', {
      url,
      API_BASE_URL,
      payload,
      hasAuthToken: !!getAuthToken()
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(payload),
      });
      
      console.log('sendChatMessage - Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('sendChatMessage - Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } catch (e) {
          throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('sendChatMessage - Success:', data);
      return data;
    } catch (error: any) {
      console.error('sendChatMessage - Exception:', error);
      throw error;
    }
  },

  /**
   * AI Chat: Get all conversations
   * GET /api/chat/conversations
   */
  async getConversations(): Promise<{ conversations: any[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * AI Chat: Get conversation by ID
   * Note: This endpoint may not exist in the OpenAPI spec, but keeping for compatibility
   */
  async getConversation(conversation_id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversation_id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * AI Chat: Create new conversation
   * POST /api/chat/conversations
   * Note: Backend requires a request body with ChatMessageRequest (message and optional conversation_id)
   */
  async createConversation(message?: string): Promise<{ conversation_id: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({
        message: message || 'Start new conversation',
        conversation_id: null
      }),
    });
    return handleApiResponse(response);
  },

  /**
   * AI Chat: Update conversation (stage, outcome, follow-up)
   * PATCH /api/chat/conversations/{conversation_id}
   */
  async updateConversation(conversationId: string, updates: {
    stage?: string;
    outcome?: string;
    status?: string;
    follow_up_date?: string;
    follow_up_notes?: string;
    tags?: string;
  }): Promise<{ success: boolean; message: string; conversation: any }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(updates),
    });
    return handleApiResponse(response);
  },

  /**
   * AI Chat: Delete conversation
   * DELETE /api/chat/conversations/{conversation_id}
   */
  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Messages: Get all messages (for message center)
   * GET /api/messages
   */
  async getMessages(booking_id?: string): Promise<{ messages: any[]; total: number }> {
    const url = booking_id 
      ? `${API_BASE_URL}/api/messages?booking_id=${booking_id}`
      : `${API_BASE_URL}/api/messages`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Messages: Send message to traveler
   */
  async sendMessage(booking_id: string, traveler_id: string, content: string, channel: 'whatsapp' | 'sms' | 'email' = 'whatsapp'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ booking_id, traveler_id, content, channel }),
    });
    return handleApiResponse(response);
  },

  /**
   * Automation: Get automation rules
   * GET /api/automation/rules
   */
  async getAutomationRules(): Promise<{ rules: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/automation/rules`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleApiResponse(response);
  },

  /**
   * Automation: Update automation rule
   * PUT /api/automation/rules/{id}
   * Note: Backend accepts enabled and template_override as query params, settings in body
   */
  async updateAutomationRule(rule_id: string, data: { enabled?: boolean; template_override?: string; settings?: any }): Promise<any> {
    const params = new URLSearchParams();
    if (data.enabled !== undefined) params.append('enabled', String(data.enabled));
    if (data.template_override !== undefined) params.append('template_override', data.template_override);
    
    const url = `${API_BASE_URL}/api/automation/rules/${rule_id}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: createHeaders(),
      body: data.settings ? JSON.stringify(data.settings) : undefined,
    });
    return handleApiResponse(response);
  },

  /**
   * Flights: Get flights requiring monitoring
   * GET /api/flights/monitor
   */
  async getFlightsToMonitor(): Promise<{ flights: any[] }> {
    const url = `${API_BASE_URL}/api/flights/monitor`;
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flights monitor API error:', errorText);
      throw new Error(`Failed to fetch flights to monitor: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle both array and object responses
    if (Array.isArray(data)) {
      return { flights: data };
    }
    if (data.flights) {
      return { flights: data.flights };
    }
    return { flights: [] };
  },

  // For demo purposes, load from local JSON
  async getDemoItinerary(): Promise<Itinerary> {
    // In production, this would come from the API
    // For now, load from public demo file
    try {
      const response = await fetch('/demo-itinerary.json');
      if (!response.ok) {
        console.warn('Failed to load demo itinerary from file, using mock data');
        return getMockItinerary();
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error loading demo itinerary:', error);
      // Fallback: return mock data
      return getMockItinerary();
    }
  },

  /**
   * PNR: Parse PNR text
   * Note: This endpoint may not be implemented yet
   */
  async parsePNR(booking_id: string, pnr_text: string, token: string): Promise<any> {
    // Placeholder implementation
    console.warn('parsePNR not implemented yet');
    throw new Error('PNR parsing not implemented');
  },
};

// Mock data for development
function getMockItinerary(): Itinerary {
  return {
    itinerary_id: 'ITIN-SDK-2025-0042',
    reference_number: 'SDK-2025-0042',
    title: 'Kenya Safari Adventure',
    description: 'A luxurious 4-night safari experience in the Masai Mara',
    travelers: [
      {
        id: 'PAX1',
        first_name: 'John',
        last_name: 'Smith',
        date_of_birth: '1985-03-15',
        passport_number: 'AB123456',
        passport_expiry: '2028-06-01',
        nationality: 'GB',
        contact: {
          email: 'john.smith@email.com',
          phone: '+447700900123',
          whatsapp: '+447700900123',
          preferred_channel: 'whatsapp' as any,
        },
      },
      {
        id: 'PAX2',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1987-07-22',
        passport_number: 'CD789012',
        passport_expiry: '2027-09-15',
        nationality: 'GB',
        contact: {
          email: 'jane.smith@email.com',
          phone: '+447700900124',
          whatsapp: '+447700900124',
          preferred_channel: 'email' as any,
        },
      },
    ],
    flights: [],
    hotels: [],
    transfers: [],
    activities: [],
    days: [],
    branding: {
      company_name: 'Safari Dreams Kenya',
      primary_color: '#2E7D32',
      secondary_color: '#FFF8E1',
      contact_phone: '+254 722 555 123',
      contact_email: 'info@safaridreams.ke',
      contact_whatsapp: '+254 722 555 123',
      website: 'www.safaridreams.ke',
      footer_text: 'Creating unforgettable African adventures since 2010',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_change_hash: '',
    duration_nights: 3,
  };
}


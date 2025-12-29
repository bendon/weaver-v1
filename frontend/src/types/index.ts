// Type definitions matching the Python models

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum TransferType {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  PHONE = 'phone'
}

export interface TravelerContact {
  email?: string;
  phone?: string;
  whatsapp?: string;
  preferred_channel: NotificationChannel;
}

export interface Traveler {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  passport_number: string;
  passport_expiry: string;
  nationality: string;
  contact: TravelerContact;
}

export interface Airport {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
}

export interface FlightSegment {
  segment_id: string;
  carrier_code: string;
  carrier_name: string;
  flight_number: string;
  aircraft_type?: string;
  departure_airport: Airport;
  departure_datetime: string;
  arrival_airport: Airport;
  arrival_datetime: string;
  duration?: string;
  cabin_class: string;
  status: BookingStatus;
}

export interface FlightBooking {
  booking_id: string;
  pnr: string;
  segments: FlightSegment[];
  travelers: string[];
  total_price: number;
  currency: string;
  booking_date: string;
  source_gds: string;
}

export interface HotelProperty {
  hotel_id: string;
  name: string;
  chain_name?: string;
  address?: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  star_rating?: number;
  amenities: string[];
}

export interface HotelReservation {
  booking_id: string;
  confirmation_number: string;
  hotel: HotelProperty;
  check_in_date: string;
  check_out_date: string;
  room_type: string;
  room_count: number;
  guests: string[];
  total_price: number;
  currency: string;
  meal_plan?: string;
  special_requests: string[];
  status: BookingStatus;
}

export interface Transfer {
  booking_id: string;
  confirmation_number?: string;
  transfer_type: TransferType;
  pickup_location: string;
  pickup_datetime?: string;
  pickup_address?: string;
  dropoff_location: string;
  dropoff_address?: string;
  vehicle_type?: string;
  provider_name?: string;
  driver_name?: string;
  driver_phone?: string;
  passengers: string[];
  total_price: number;
  currency: string;
  status: BookingStatus;
}

export interface Activity {
  booking_id: string;
  confirmation_number?: string;
  name: string;
  description?: string;
  activity_date: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  location?: string;
  meeting_point?: string;
  provider_name?: string;
  provider_phone?: string;
  participants: string[];
  total_price: number;
  currency: string;
  inclusions: string[];
  what_to_bring: string[];
  status: BookingStatus;
}

export interface ItineraryBranding {
  company_name: string;
  primary_color: string;
  secondary_color: string;
  contact_phone?: string;
  contact_email?: string;
  contact_whatsapp?: string;
  website?: string;
  footer_text?: string;
  logo_url?: string;
}

export interface ItineraryDay {
  date: string;
  day_number: number;
  location: string;
  activities: Activity[];
  transfers: Transfer[];
  notes: string[];
}

export interface Itinerary {
  itinerary_id: string;
  reference_number: string;
  title: string;
  description?: string;
  travelers: Traveler[];
  flights: FlightBooking[];
  hotels: HotelReservation[];
  transfers: Transfer[];
  activities: Activity[];
  days: ItineraryDay[];
  branding?: ItineraryBranding;
  created_at: string;
  updated_at: string;
  last_change_hash: string;
  duration_nights: number;
}


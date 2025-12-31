// Template Renderers for WeaverAssistant V2
// Renders structured cards based on response templates

import { Plane, Hotel, Calendar, MapPin, Users, DollarSign } from 'lucide-react'

interface FlightOption {
  id: string
  airline: string
  flight_number: string
  departure_time: string
  arrival_time: string
  duration: string
  stops: number
  price: number
  currency: string
  class: string
  available_seats: number
}

interface FlightResultsProps {
  data: {
    flights: FlightOption[]
    search_params: {
      origin: string
      origin_name: string
      destination: string
      destination_name: string
      date: string
      travelers: number
      class: string
    }
  }
  onSelectFlight?: (flightId: string) => void
}

export function FlightResultsTemplate({ data, onSelectFlight }: FlightResultsProps) {
  const { flights, search_params } = data

  return (
    <div className="space-y-3 max-w-md">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b bg-neutral-50">
          <span className="text-sm font-medium">
            Flight Options — {search_params.origin_name} to {search_params.destination_name}
          </span>
        </div>

        {/* Flight Options */}
        <div className="divide-y">
          {flights.map((flight, index) => (
            <label
              key={flight.id}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <input
                type="radio"
                name="flight"
                defaultChecked={index === 0}
                onChange={() => onSelectFlight?.(flight.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{flight.airline}</span>
                    {flight.stops === 0 && (
                      <span className="ml-2 text-xs text-green-600">Direct</span>
                    )}
                    {flight.stops > 0 && (
                      <span className="ml-2 text-xs text-neutral-500">
                        {flight.stops} Stop{flight.stops > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-sm font-medium">
                    ${flight.price}
                  </span>
                </div>
                <div className="text-sm text-neutral-600 mt-0.5">
                  {flight.flight_number} · {flight.departure_time} → {flight.arrival_time}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {flight.duration} · {flight.available_seats} seats available
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

interface HotelOption {
  id: string
  name: string
  category: string
  rating: number
  stars: number
  price_per_night: number
  total_price: number
  currency: string
  amenities: string[]
  location: string
  available_rooms: number
  room_type: string
}

interface HotelResultsProps {
  data: {
    hotels: HotelOption[]
    search_params: {
      destination: string
      destination_name: string
      check_in: string
      check_out: string
      guests: number
      nights: number
    }
  }
  onSelectHotel?: (hotelId: string) => void
}

export function HotelResultsTemplate({ data, onSelectHotel }: HotelResultsProps) {
  const { hotels, search_params } = data

  return (
    <div className="space-y-3 max-w-md">
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b bg-neutral-50">
          <span className="text-sm font-medium">
            Hotels in {search_params.destination_name} · {search_params.nights} night{search_params.nights > 1 ? 's' : ''}
          </span>
        </div>

        <div className="divide-y">
          {hotels.map((hotel, index) => (
            <label
              key={hotel.id}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <input
                type="radio"
                name="hotel"
                defaultChecked={index === 0}
                onChange={() => onSelectHotel?.(hotel.id)}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{hotel.name}</span>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {'★'.repeat(hotel.stars)} · {hotel.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-medium">
                      ${hotel.total_price}
                    </div>
                    <div className="text-xs text-neutral-500">
                      ${hotel.price_per_night}/night
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hotel.amenities.slice(0, 3).map((amenity) => (
                    <span
                      key={amenity}
                      className="text-xs px-2 py-0.5 bg-neutral-100 rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <span className="text-xs px-2 py-0.5 text-neutral-500">
                      +{hotel.amenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

interface ItineraryDay {
  day: number
  date: string
  title: string
  activities: Array<{
    time: string
    title: string
    description: string
    included: boolean
  }>
  accommodation: {
    name: string
    type: string
    meal_plan: string
  } | null
}

interface ItineraryResultsProps {
  data: {
    itinerary: {
      title: string
      destination: string
      duration_days: number
      days: ItineraryDay[]
      pricing?: {
        total: number
        per_person: number
        currency: string
        breakdown?: Record<string, number>
      }
    }
  }
}

export function ItineraryResultsTemplate({ data }: ItineraryResultsProps) {
  const { itinerary } = data

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Itinerary Header */}
      <div className="card p-4">
        <h3 className="font-medium text-lg mb-2">{itinerary.title}</h3>
        <div className="flex gap-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {itinerary.destination}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {itinerary.duration_days} days
          </span>
        </div>
      </div>

      {/* Days Summary (first 3 days) */}
      {itinerary.days.slice(0, 3).map((day) => (
        <div key={day.day} className="card p-4">
          <div className="font-medium mb-2">
            Day {day.day}: {day.title}
          </div>
          <div className="space-y-2">
            {day.activities.slice(0, 2).map((activity, idx) => (
              <div key={idx} className="text-sm">
                <span className="text-neutral-500">{activity.time}</span>
                <span className="ml-2">{activity.title}</span>
              </div>
            ))}
            {day.activities.length > 2 && (
              <div className="text-xs text-neutral-500">
                +{day.activities.length - 2} more activities
              </div>
            )}
          </div>
          {day.accommodation && (
            <div className="mt-2 pt-2 border-t text-sm text-neutral-600">
              <Hotel size={14} className="inline mr-1" />
              {day.accommodation.name} · {day.accommodation.meal_plan}
            </div>
          )}
        </div>
      ))}

      {itinerary.days.length > 3 && (
        <div className="text-sm text-neutral-500 text-center">
          +{itinerary.days.length - 3} more days
        </div>
      )}

      {/* Pricing Summary */}
      {itinerary.pricing && (
        <div className="card p-4">
          <div className="font-medium mb-3">Estimated Budget</div>
          {itinerary.pricing.breakdown && (
            <div className="space-y-2 text-sm">
              {Object.entries(itinerary.pricing.breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-neutral-600 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="font-mono">${value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t font-medium">
                <span>Total</span>
                <span className="font-mono">${itinerary.pricing.total}</span>
              </div>
            </div>
          )}
          {!itinerary.pricing.breakdown && (
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="font-mono">${itinerary.pricing.total}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface BookingConfirmationProps {
  data: {
    booking: {
      booking_reference: string
      status: string
      destination: string
      start_date: string
      end_date: string
      total_amount: number
      currency: string
    }
  }
}

export function BookingConfirmationTemplate({ data }: BookingConfirmationProps) {
  const { booking } = data

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    draft: 'bg-neutral-100 text-neutral-800',
  }

  return (
    <div className="card p-4 max-w-md">
      <p className="font-medium mb-3">Booking Created</p>
      <div className="p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-medium">
            {booking.booking_reference}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              statusColors[booking.status as keyof typeof statusColors] || statusColors.draft
            }`}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
        <p className="text-sm text-neutral-600 mt-2">
          {booking.destination} · {new Date(booking.start_date).toLocaleDateString()} –{' '}
          {new Date(booking.end_date).toLocaleDateString()} · ${booking.total_amount}
        </p>
      </div>
    </div>
  )
}

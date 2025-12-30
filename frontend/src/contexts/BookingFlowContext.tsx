'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FlightSelection {
  offerId: string;
  offer: any;
  searchParams: any;
}

interface HotelSelection {
  hotelId: string;
  offer: any;
}

interface BookingFlowState {
  bookingId?: string;
  selectedFlight?: FlightSelection;
  selectedHotel?: HotelSelection;
  travelers: any[];
  tripDetails?: {
    title: string;
    start_date: string;
    end_date: string;
    notes?: string;
  };
}

interface BookingFlowContextType {
  state: BookingFlowState;
  setBookingId: (id: string) => void;
  selectFlight: (offer: any, searchParams: any) => void;
  selectHotel: (hotel: any) => void;
  addTraveler: (traveler: any) => void;
  setTripDetails: (details: any) => void;
  clearFlow: () => void;
}

const BookingFlowContext = createContext<BookingFlowContextType | undefined>(undefined);

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>({
    travelers: [],
  });

  const setBookingId = (id: string) => {
    setState(prev => ({ ...prev, bookingId: id }));
  };

  const selectFlight = (offer: any, searchParams: any) => {
    setState(prev => ({
      ...prev,
      selectedFlight: {
        offerId: offer.id,
        offer,
        searchParams,
      },
    }));
  };

  const selectHotel = (hotel: any) => {
    setState(prev => ({
      ...prev,
      selectedHotel: {
        hotelId: hotel.id,
        offer: hotel,
      },
    }));
  };

  const addTraveler = (traveler: any) => {
    setState(prev => ({
      ...prev,
      travelers: [...prev.travelers, traveler],
    }));
  };

  const setTripDetails = (details: any) => {
    setState(prev => ({
      ...prev,
      tripDetails: details,
    }));
  };

  const clearFlow = () => {
    setState({ travelers: [] });
  };

  return (
    <BookingFlowContext.Provider
      value={{
        state,
        setBookingId,
        selectFlight,
        selectHotel,
        addTraveler,
        setTripDetails,
        clearFlow,
      }}
    >
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const context = useContext(BookingFlowContext);
  if (!context) {
    throw new Error('useBookingFlow must be used within BookingFlowProvider');
  }
  return context;
}

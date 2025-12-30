'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AddFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingStartDate?: string;
  bookingEndDate?: string;
}

export function AddFlightModal({ isOpen, onClose, bookingId, bookingStartDate, bookingEndDate }: AddFlightModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      // Build flight search URL with booking context and dates
      const params = new URLSearchParams();
      params.set('bookingId', bookingId);
      
      if (bookingStartDate) {
        params.set('departure_date', bookingStartDate);
      }
      
      if (bookingEndDate) {
        params.set('return_date', bookingEndDate);
      }

      // Redirect to flight search page
      router.push(`/flights/search?${params.toString()}`);
      onClose();
    }
  }, [isOpen, bookingId, bookingStartDate, bookingEndDate, router, onClose]);

  // Don't render modal - just redirect
  return null;
}


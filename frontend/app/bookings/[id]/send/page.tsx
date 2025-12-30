'use client';

import { useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Send, Check } from 'lucide-react';

function BookingSendContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [selectedTraveler, setSelectedTraveler] = useState<string>('');
  const [step, setStep] = useState(1);

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.sendItinerary(bookingId),
    onSuccess: () => setStep(4),
  });

  const travelers = booking?.travelers || [];

  return (
    <DashboardLayout
      title="Send Itinerary"
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: booking?.booking_code || bookingId, href: `/bookings/${bookingId}` },
        { label: 'Send' },
      ]}
      backButton={{
        label: 'Back',
        href: `/bookings/${bookingId}`,
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {step === 1 && (
          <div>
            <h2>Select Traveler(s)</h2>
            <div style={{ marginTop: '1.5rem' }}>
              {travelers.length === 0 ? (
                <p>No travelers linked to this booking</p>
              ) : (
                travelers.map((traveler: any) => (
                  <label key={traveler.id} style={{ display: 'block', marginBottom: '1rem' }}>
                    <input
                      type="radio"
                      name="traveler"
                      value={traveler.id}
                      checked={selectedTraveler === traveler.id}
                      onChange={(e) => setSelectedTraveler(e.target.value)}
                    />
                    <span style={{ marginLeft: '0.5rem' }}>
                      {traveler.first_name} {traveler.last_name}
                    </span>
                  </label>
                ))
              )}
            </div>
            <button
              className="btn-primary"
              onClick={() => setStep(2)}
              disabled={!selectedTraveler}
              style={{ marginTop: '1.5rem' }}
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Choose Channel</h2>
            <p style={{ marginTop: '1rem' }}>WhatsApp (Primary)</p>
            <button className="btn-primary" onClick={() => setStep(3)} style={{ marginTop: '1.5rem' }}>
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>Preview Message</h2>
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
              <p>Itinerary preview will appear here</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              style={{ marginTop: '1.5rem' }}
            >
              <Send size={16} />
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Check size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <h2>Itinerary Sent!</h2>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>
              The itinerary has been sent to the traveler via WhatsApp.
            </p>
            <button
              className="btn-primary"
              onClick={() => router.push(`/bookings/${bookingId}`)}
              style={{ marginTop: '1.5rem' }}
            >
              Back to Booking
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function BookingSendPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSendContent />
    </Suspense>
  );
}


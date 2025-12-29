'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft } from 'lucide-react';

function BookingEditContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateBooking(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      router.push(`/bookings/${bookingId}`);
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    status: 'draft',
    notes: '',
  });

  // Initialize form when booking loads
  useEffect(() => {
    if (booking) {
      setFormData({
        title: booking.title || '',
        start_date: booking.start_date || '',
        end_date: booking.end_date || '',
        status: booking.status || 'draft',
        notes: booking.notes || '',
      });
    }
  }, [booking]);

  if (isLoading) return <div>Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <DashboardLayout
      title="Edit Booking"
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: booking.booking_code || bookingId, href: `/bookings/${bookingId}` },
        { label: 'Edit' },
      ]}
    >
      <div style={{ maxWidth: '800px' }}>
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} />
          Back
        </button>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              />
            </div>
            <div>
              <label>End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={5}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function BookingEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingEditContent />
    </Suspense>
  );
}


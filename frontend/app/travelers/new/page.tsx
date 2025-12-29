'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ArrowLeft } from 'lucide-react';

function NewTravelerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTraveler(
      data.first_name,
      data.last_name,
      data.phone,
      data.email
    ),
    onSuccess: (data) => {
      if (bookingId) {
        router.push(`/bookings/${bookingId}`);
      } else {
        router.push(`/travelers/${data.id || data.traveler_id}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <DashboardLayout
      title="Add Traveler"
      breadcrumbs={[
        { label: 'Travelers', href: '/travelers' },
        { label: 'New' },
      ]}
    >
      <div style={{ maxWidth: '800px' }}>
        <button onClick={() => router.back()}>
          <ArrowLeft size={20} />
          Back
        </button>
        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label>First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              />
            </div>
            <div>
              <label>Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Traveler'}
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

export default function NewTravelerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewTravelerContent />
    </Suspense>
  );
}


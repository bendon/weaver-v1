'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

function TravelersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const { data, isLoading } = useQuery({
    queryKey: ['travelers', search],
    queryFn: async () => {
      const result = await api.getTravelers();
      if (search) {
        const filtered = result.travelers.filter((t: any) => {
          const name = `${t.first_name || ''} ${t.last_name || ''}`.toLowerCase();
          const email = (t.email || '').toLowerCase();
          const phone = (t.phone || '').toLowerCase();
          const searchLower = search.toLowerCase();
          return name.includes(searchLower) || email.includes(searchLower) || phone.includes(searchLower);
        });
        return { travelers: filtered, total: filtered.length };
      }
      return result;
    },
  });

  const travelers = data?.travelers || [];

  return (
    <DashboardLayout
      title="Travelers"
      actions={
        <button className="btn-primary" onClick={() => router.push('/travelers/new')}>
          <Plus size={20} />
          Add Traveler
        </button>
      }
    >
      <div>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: 'white' }}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Search travelers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div>Loading travelers...</div>
        ) : travelers.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p>No travelers yet</p>
            <button className="btn-primary" onClick={() => router.push('/travelers/new')} style={{ marginTop: '1rem' }}>
              Add First Traveler
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {travelers.map((traveler: any) => (
              <div
                key={traveler.id || traveler.traveler_id}
                style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.5rem', cursor: 'pointer' }}
                onClick={() => router.push(`/travelers/${traveler.id || traveler.traveler_id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0073E6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {traveler.first_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{traveler.first_name} {traveler.last_name}</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{traveler.phone || 'No phone'}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{traveler.email || 'No email'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TravelersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TravelersPageContent />
    </Suspense>
  );
}


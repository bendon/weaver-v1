import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Search, Plus, User, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export const TravelersDirectory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTraveler, setNewTraveler] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    phone_country_code: '+1',
  });

  const queryClient = useQueryClient();

  const { data: travelersData, isLoading } = useQuery({
    queryKey: ['travelers'],
    queryFn: async () => {
      try {
        return await api.getTravelers();
      } catch (err) {
        return { travelers: [], total: 0 };
      }
    },
  });

  const createTravelerMutation = useMutation({
    mutationFn: async () => {
      return await api.createTraveler(
        newTraveler.first_name,
        newTraveler.last_name,
        newTraveler.phone,
        newTraveler.email,
        newTraveler.phone_country_code
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travelers'] });
      setShowCreateModal(false);
      setNewTraveler({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        phone_country_code: '+1',
      });
    },
  });

  const travelers = travelersData?.travelers || [];
  const filteredTravelers = travelers.filter((t: any) => {
    const query = searchQuery.toLowerCase();
    return (
      t.first_name?.toLowerCase().includes(query) ||
      t.last_name?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="travelers-directory">
      <div className="travelers-header">
        <div>
          <h1 className="travelers-title">Travelers Directory</h1>
          <p className="travelers-subtitle">Manage all your travelers</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Add Traveler
        </button>
      </div>

      <div className="travelers-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search travelers by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {isLoading ? (
        <div className="loading-state">
          <p>Loading travelers...</p>
        </div>
      ) : filteredTravelers.length === 0 ? (
        <div className="empty-state">
          <User size={48} className="empty-icon" />
          <h3>No travelers found</h3>
          <p>{searchQuery ? 'Try a different search term' : 'Get started by adding your first traveler'}</p>
        </div>
      ) : (
        <div className="travelers-grid">
          {filteredTravelers.map((traveler: any) => (
            <div key={traveler.id} className="traveler-card">
              <div className="traveler-card-header">
                <div className="traveler-avatar">
                  {traveler.first_name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="traveler-info">
                  <h3 className="traveler-name">
                    {traveler.first_name} {traveler.last_name}
                  </h3>
                  <p className="traveler-id">ID: {traveler.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="traveler-details">
                {traveler.phone && (
                  <div className="traveler-detail">
                    <Phone size={16} />
                    <span>{traveler.phone_country_code || ''}{traveler.phone}</span>
                  </div>
                )}
                {traveler.email && (
                  <div className="traveler-detail">
                    <Mail size={16} />
                    <span>{traveler.email}</span>
                  </div>
                )}
              </div>
              <div className="traveler-card-actions">
                <button className="btn-icon" title="Edit">
                  <Edit size={16} />
                </button>
                <button className="btn-icon" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Traveler</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTravelerMutation.mutate();
              }}
            >
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  required
                  value={newTraveler.first_name}
                  onChange={(e) => setNewTraveler({ ...newTraveler, first_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  required
                  value={newTraveler.last_name}
                  onChange={(e) => setNewTraveler({ ...newTraveler, last_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="phone-input-group">
                  <select
                    value={newTraveler.phone_country_code}
                    onChange={(e) => setNewTraveler({ ...newTraveler, phone_country_code: e.target.value })}
                  >
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+254">+254</option>
                    <option value="+255">+255</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={newTraveler.phone}
                    onChange={(e) => setNewTraveler({ ...newTraveler, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email (optional)</label>
                <input
                  type="email"
                  value={newTraveler.email}
                  onChange={(e) => setNewTraveler({ ...newTraveler, email: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTravelerMutation.isPending}
                  className="btn-primary"
                >
                  {createTravelerMutation.isPending ? 'Creating...' : 'Create Traveler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


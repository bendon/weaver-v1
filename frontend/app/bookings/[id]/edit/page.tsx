'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Plane, Hotel, Users, ArrowRight, Calendar, Check, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/Skeleton';
import '../../new/new-booking.css';

type Step = 'details' | 'travelers' | 'flights' | 'review';

function BookingEditContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [tripDetails, setTripDetails] = useState({
    title: '',
    start_date: '',
    end_date: '',
    total_travelers: 1,
    notes: '',
  });

  const [selectedTravelers, setSelectedTravelers] = useState<string[]>([]);
  const [newTraveler, setNewTraveler] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch booking data
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.getBooking(bookingId),
  });

  // Fetch existing travelers for this booking
  const { data: bookingTravelersData, isLoading: bookingTravelersLoading } = useQuery({
    queryKey: ['booking-travelers', bookingId],
    queryFn: () => api.getBookingTravelers(bookingId),
    enabled: !!bookingId,
  });

  // Fetch existing flights for this booking
  const { data: bookingFlightsData } = useQuery({
    queryKey: ['booking-flights', bookingId],
    queryFn: () => api.getBookingFlights(bookingId),
    enabled: !!bookingId,
  });

  // Fetch all travelers (for selection)
  const { data: travelersData, isLoading: travelersLoading } = useQuery({
    queryKey: ['travelers'],
    queryFn: () => api.getTravelers(),
  });

  const travelers = travelersData?.travelers || [];
  const bookingTravelers = bookingTravelersData?.travelers || [];
  const bookingFlights = bookingFlightsData?.flights || [];

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      setTripDetails({
        title: booking.title || '',
        start_date: booking.start_date ? booking.start_date.split('T')[0] : '',
        end_date: booking.end_date ? booking.end_date.split('T')[0] : '',
        total_travelers: booking.total_travelers || bookingTravelers.length || 1,
        notes: booking.notes || '',
      });
    }
  }, [booking, bookingTravelers.length]);

  // Initialize selected travelers
  useEffect(() => {
    if (bookingTravelers.length > 0) {
      setSelectedTravelers(bookingTravelers.map((t: any) => t.id || t.traveler_id));
    }
  }, [bookingTravelers]);

  // Validation functions
  const validateTripDetails = () => {
    const newErrors: Record<string, string> = {};

    if (!tripDetails.title.trim()) {
      newErrors.title = 'Trip title is required';
    } else if (tripDetails.title.length < 3) {
      newErrors.title = 'Trip title must be at least 3 characters';
    }

    if (!tripDetails.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!tripDetails.end_date) {
      newErrors.end_date = 'End date is required';
    } else if (tripDetails.start_date && tripDetails.end_date && tripDetails.end_date < tripDetails.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewTraveler = () => {
    const newErrors: Record<string, string> = {};

    if (newTraveler.first_name && newTraveler.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (newTraveler.last_name && newTraveler.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    if (newTraveler.phone && !/^[\d\s\-\+\(\)]+$/.test(newTraveler.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (newTraveler.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newTraveler.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async () => {
      // Update booking details
      await api.updateBooking(bookingId, {
        title: tripDetails.title,
        start_date: tripDetails.start_date,
        end_date: tripDetails.end_date,
        notes: tripDetails.notes,
      });

      // Update travelers (remove all and re-add selected)
      // Note: This is a simplified approach - in production you'd want to diff and update
      const currentTravelerIds = bookingTravelers.map((t: any) => t.id || t.traveler_id);
      const toRemove = currentTravelerIds.filter((id: string) => !selectedTravelers.includes(id));
      const toAdd = selectedTravelers.filter((id: string) => !currentTravelerIds.includes(id));

      // Remove travelers (would need API endpoint for this)
      // For now, we'll just ensure all selected travelers are linked
      for (const travelerId of selectedTravelers) {
        try {
          await api.linkTravelerToBooking(
            bookingId,
            travelerId,
            travelerId === selectedTravelers[0]
          );
        } catch (error) {
          // Traveler might already be linked, continue
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated successfully!');
      setTimeout(() => {
        router.push(`/bookings/${bookingId}`);
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update booking. Please try again.');
    },
  });

  // Create traveler mutation
  const createTravelerMutation = useMutation({
    mutationFn: () => api.createTraveler(
      newTraveler.first_name,
      newTraveler.last_name,
      newTraveler.phone,
      newTraveler.email
    ),
    onSuccess: (traveler) => {
      queryClient.invalidateQueries({ queryKey: ['travelers'] });
      setSelectedTravelers([...selectedTravelers, traveler.id]);
      setNewTraveler({ first_name: '', last_name: '', phone: '', email: '' });
      toast.success(`${traveler.first_name} ${traveler.last_name} added successfully!`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add traveler. Please try again.');
    },
  });

  const handleNext = () => {
    if (currentStep === 'details') {
      if (!validateTripDetails()) {
        toast.error('Please fix the validation errors');
        return;
      }
      setCurrentStep('travelers');
      setErrors({});
    } else if (currentStep === 'travelers') {
      if (selectedTravelers.length === 0) {
        toast.error('Please add at least one traveler');
        return;
      }
      setCurrentStep('flights');
    } else if (currentStep === 'flights') {
      setCurrentStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'travelers') setCurrentStep('details');
    else if (currentStep === 'flights') setCurrentStep('travelers');
    else if (currentStep === 'review') setCurrentStep('flights');
  };

  const handleUpdateBooking = () => {
    updateBookingMutation.mutate();
  };

  const toggleTraveler = (id: string) => {
    setSelectedTravelers(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const steps = [
    { id: 'details', label: 'Trip Details', icon: Calendar },
    { id: 'travelers', label: 'Travelers', icon: Users },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'review', label: 'Review', icon: Check },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  if (bookingLoading) {
    return (
      <DashboardLayout
        title="Edit Booking"
        breadcrumbs={[
          { label: 'Bookings', href: '/bookings' },
          { label: bookingId },
          { label: 'Edit' },
        ]}
      >
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading booking...</div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout
        title="Edit Booking"
        breadcrumbs={[
          { label: 'Bookings', href: '/bookings' },
          { label: bookingId },
          { label: 'Edit' },
        ]}
      >
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Booking not found</h2>
          <button onClick={() => router.push('/bookings')}>Back to Bookings</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Booking"
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: booking.booking_code || bookingId, href: `/bookings/${bookingId}` },
        { label: 'Edit' },
      ]}
      backButton={{
        label: 'Back',
        href: `/bookings/${bookingId}`,
      }}
    >
      <div className="new-booking-page">
        {/* Progress Steps */}
        <div className="booking-steps">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div
                key={step.id}
                className={`booking-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className="step-icon">
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <div className="step-label">{step.label}</div>
                {index < steps.length - 1 && <div className="step-connector" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="booking-content">
          {currentStep === 'details' && (
            <div className="step-content">
              <h2>Trip Details</h2>
              <div className="form-group">
                <label>Trip Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Kenya Safari Adventure"
                  value={tripDetails.title}
                  onChange={(e) => {
                    setTripDetails({ ...tripDetails, title: e.target.value });
                    if (touched.title && errors.title) {
                      setErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  onBlur={() => {
                    setTouched(prev => ({ ...prev, title: true }));
                    validateTripDetails();
                  }}
                  className={touched.title && errors.title ? 'error' : ''}
                />
                {touched.title && errors.title && (
                  <span className="error-message">{errors.title}</span>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={tripDetails.start_date}
                    onChange={(e) => {
                      setTripDetails({ ...tripDetails, start_date: e.target.value });
                      if (touched.start_date && errors.start_date) {
                        setErrors(prev => ({ ...prev, start_date: '' }));
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, start_date: true }));
                      validateTripDetails();
                    }}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className={touched.start_date && errors.start_date ? 'error' : ''}
                  />
                  {touched.start_date && errors.start_date && (
                    <span className="error-message">{errors.start_date}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={tripDetails.end_date}
                    onChange={(e) => {
                      setTripDetails({ ...tripDetails, end_date: e.target.value });
                      if (touched.end_date && errors.end_date) {
                        setErrors(prev => ({ ...prev, end_date: '' }));
                      }
                    }}
                    onBlur={() => {
                      setTouched(prev => ({ ...prev, end_date: true }));
                      validateTripDetails();
                    }}
                    min={tripDetails.start_date}
                    className={touched.end_date && errors.end_date ? 'error' : ''}
                  />
                  {touched.end_date && errors.end_date && (
                    <span className="error-message">{errors.end_date}</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Number of Travelers</label>
                <input
                  type="number"
                  min="1"
                  value={tripDetails.total_travelers}
                  onChange={(e) => setTripDetails({ ...tripDetails, total_travelers: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  placeholder="Add any special requirements or notes..."
                  value={tripDetails.notes}
                  onChange={(e) => setTripDetails({ ...tripDetails, notes: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}

          {currentStep === 'travelers' && (
            <div className="step-content">
              <h2>Select Travelers</h2>

              {/* Existing Travelers */}
              {travelersLoading || bookingTravelersLoading ? (
                <div className="travelers-section">
                  <h3>Existing Travelers</h3>
                  <div className="travelers-list">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div key={i} className="traveler-option">
                        <Skeleton width="20px" height="20px" />
                        <div className="traveler-info" style={{ flex: 1 }}>
                          <Skeleton width="150px" height="1rem" />
                          <Skeleton width="200px" height="0.875rem" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : travelers.length > 0 && (
                <div className="travelers-section">
                  <h3>Existing Travelers</h3>
                  <div className="travelers-list">
                    {travelers.map((traveler: any) => (
                      <div
                        key={traveler.id}
                        className={`traveler-option ${selectedTravelers.includes(traveler.id) ? 'selected' : ''}`}
                        onClick={() => toggleTraveler(traveler.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTravelers.includes(traveler.id)}
                          onChange={() => {}}
                        />
                        <div className="traveler-info">
                          <strong>{traveler.first_name} {traveler.last_name}</strong>
                          <span>{traveler.email || traveler.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Traveler */}
              <div className="add-traveler-section">
                <h3>Add New Traveler</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={newTraveler.first_name}
                      onChange={(e) => {
                        setNewTraveler({ ...newTraveler, first_name: e.target.value });
                        if (touched.first_name && errors.first_name) {
                          setErrors(prev => ({ ...prev, first_name: '' }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, first_name: true }));
                        validateNewTraveler();
                      }}
                      className={touched.first_name && errors.first_name ? 'error' : ''}
                    />
                    {touched.first_name && errors.first_name && (
                      <span className="error-message">{errors.first_name}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={newTraveler.last_name}
                      onChange={(e) => {
                        setNewTraveler({ ...newTraveler, last_name: e.target.value });
                        if (touched.last_name && errors.last_name) {
                          setErrors(prev => ({ ...prev, last_name: '' }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, last_name: true }));
                        validateNewTraveler();
                      }}
                      className={touched.last_name && errors.last_name ? 'error' : ''}
                    />
                    {touched.last_name && errors.last_name && (
                      <span className="error-message">{errors.last_name}</span>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={newTraveler.phone}
                      onChange={(e) => {
                        setNewTraveler({ ...newTraveler, phone: e.target.value });
                        if (touched.phone && errors.phone) {
                          setErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, phone: true }));
                        validateNewTraveler();
                      }}
                      className={touched.phone && errors.phone ? 'error' : ''}
                    />
                    {touched.phone && errors.phone && (
                      <span className="error-message">{errors.phone}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={newTraveler.email}
                      onChange={(e) => {
                        setNewTraveler({ ...newTraveler, email: e.target.value });
                        if (touched.email && errors.email) {
                          setErrors(prev => ({ ...prev, email: '' }));
                        }
                      }}
                      onBlur={() => {
                        setTouched(prev => ({ ...prev, email: true }));
                        validateNewTraveler();
                      }}
                      className={touched.email && errors.email ? 'error' : ''}
                    />
                    {touched.email && errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => createTravelerMutation.mutate()}
                  disabled={!newTraveler.first_name || !newTraveler.last_name || !newTraveler.phone || createTravelerMutation.isPending}
                >
                  {createTravelerMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Traveler
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'flights' && (
            <div className="step-content">
              <h2>Flights</h2>

              {bookingFlights.length > 0 ? (
                <div className="selected-flight-info">
                  <h3>Current Flights ({bookingFlights.length})</h3>
                  {bookingFlights.map((flight: any, idx: number) => (
                    <div key={flight.id || idx} className="flight-summary" style={{ marginBottom: '1rem' }}>
                      <Plane size={24} />
                      <div>
                        <strong>
                          {flight.departure_airport || flight.origin} → {flight.arrival_airport || flight.destination}
                        </strong>
                        <p>
                          {flight.carrier_code || ''}{flight.flight_number || ''} - {flight.status || 'confirmed'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    To add or modify flights, visit the booking detail page.
                  </p>
                </div>
              ) : (
                <div className="no-flight-selected">
                  <p>No flights added yet</p>
                  <button
                    className="btn-primary"
                    onClick={() => router.push(`/bookings/${bookingId}`)}
                  >
                    <Plane size={16} />
                    Add Flights
                  </button>
                </div>
              )}

              <div className="skip-option">
                <p>You can manage flights from the booking detail page</p>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="step-content">
              <h2>Review & Update</h2>

              <div className="review-section">
                <h3>Trip Details</h3>
                <dl>
                  <dt>Title:</dt>
                  <dd>{tripDetails.title}</dd>
                  <dt>Dates:</dt>
                  <dd>
                    {tripDetails.start_date && tripDetails.end_date
                      ? `${format(new Date(tripDetails.start_date), 'MMM d, yyyy')} - ${format(new Date(tripDetails.end_date), 'MMM d, yyyy')}`
                      : 'TBD'
                    }
                  </dd>
                  <dt>Travelers:</dt>
                  <dd>{selectedTravelers.length} selected</dd>
                </dl>
              </div>

              <div className="review-section">
                <h3>Travelers</h3>
                <ul>
                  {selectedTravelers.map(id => {
                    const traveler = travelers.find((t: any) => t.id === id);
                    return traveler ? (
                      <li key={id}>{traveler.first_name} {traveler.last_name}</li>
                    ) : null;
                  })}
                </ul>
              </div>

              {bookingFlights.length > 0 && (
                <div className="review-section">
                  <h3>Flights</h3>
                  <p>{bookingFlights.length} flight{bookingFlights.length !== 1 ? 's' : ''} included</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="booking-navigation">
          <button className="btn-secondary" onClick={() => router.push(`/bookings/${bookingId}`)}>
            <ArrowLeft size={16} />
            Cancel
          </button>
          <div style={{ flex: 1 }} />
          {currentStep !== 'details' && (
            <button className="btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          {currentStep !== 'review' ? (
            <button className="btn-primary" onClick={handleNext}>
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleUpdateBooking}
              disabled={updateBookingMutation.isPending}
            >
              {updateBookingMutation.isPending ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Update Booking
                </>
              )}
            </button>
          )}
        </div>
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

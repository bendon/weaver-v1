'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { Plus, Plane, Hotel, Users, ArrowRight, Calendar, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useBookingFlow } from '@/contexts/BookingFlowContext';
import { Skeleton } from '@/components/Skeleton';
import './new-booking.css';

type Step = 'details' | 'travelers' | 'flights' | 'review';

export default function NewBookingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { state: flowState, setBookingId, clearFlow } = useBookingFlow();

  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [tripDetails, setTripDetails] = useState({
    title: '',
    start_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
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

  // Fetch existing travelers
  const { data: travelersData, isLoading: travelersLoading } = useQuery({
    queryKey: ['travelers'],
    queryFn: () => api.getTravelers(),
  });

  const travelers = travelersData?.travelers || [];

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const booking = await api.createBooking(
        tripDetails.title,
        tripDetails.start_date,
        tripDetails.end_date,
        tripDetails.total_travelers,
        tripDetails.notes
      );

      // Link selected travelers
      for (const travelerId of selectedTravelers) {
        await api.linkTravelerToBooking(
          booking.id,
          travelerId,
          travelerId === selectedTravelers[0]
        );
      }

      // If there's a selected flight from flow, add it
      if (flowState.selectedFlight) {
        const flight = flowState.selectedFlight.offer;
        const searchParams = flowState.selectedFlight.searchParams;

        // Extract flight details from Amadeus offer
        const outbound = flight.itineraries?.[0];
        const returnItinerary = flight.itineraries?.[1];
        
        const outboundFirst = outbound?.segments?.[0];
        const outboundLast = outbound?.segments?.[outbound?.segments?.length - 1];
        
        const returnFirst = returnItinerary?.segments?.[0];
        const returnLast = returnItinerary?.segments?.[returnItinerary?.segments?.length - 1];

        // Add outbound flight
        if (outboundFirst && outboundLast) {
          const departureDate = new Date(outboundFirst.departure.at);
          await api.addFlightToBooking(booking.id, {
            carrier_code: outboundFirst.carrierCode,
            flight_number: outboundFirst.number,
            departure_date: departureDate.toISOString().split('T')[0],
            departure_airport: outboundFirst.departure.iataCode,
            arrival_airport: outboundLast.arrival.iataCode,
            scheduled_departure: outboundFirst.departure.at,
            scheduled_arrival: outboundLast.arrival.at,
            flight_type: 'outbound',
            booking_reference: flight.id, // Use offer ID as temp reference
            status: 'scheduled',
          });
        }

        // Add return flight if it exists
        if (returnItinerary && returnFirst && returnLast) {
          const returnDepartureDate = new Date(returnFirst.departure.at);
          await api.addFlightToBooking(booking.id, {
            carrier_code: returnFirst.carrierCode,
            flight_number: returnFirst.number,
            departure_date: returnDepartureDate.toISOString().split('T')[0],
            departure_airport: returnFirst.departure.iataCode,
            arrival_airport: returnLast.arrival.iataCode,
            scheduled_departure: returnFirst.departure.at,
            scheduled_arrival: returnLast.arrival.at,
            flight_type: 'return',
            booking_reference: flight.id, // Use offer ID as temp reference
            status: 'scheduled',
          });
        }
      }

      return booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setBookingId(booking.id);
      toast.success('Booking created successfully!');
      setTimeout(() => {
        router.push(`/bookings/${booking.id}`);
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create booking. Please try again.');
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

  const handleCreateBooking = () => {
    createBookingMutation.mutate();
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

  return (
    <DashboardLayout
      title="Create New Booking"
      breadcrumbs={[
        { label: 'Bookings', href: '/bookings' },
        { label: 'New Booking' },
      ]}
      backButton={{
        label: 'Back',
        href: '/bookings',
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
                  onChange={(e) => setTripDetails({ ...tripDetails, total_travelers: parseInt(e.target.value) })}
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
              {travelersLoading ? (
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
              <h2>Add Flights</h2>

              {flowState.selectedFlight ? (
                <div className="selected-flight-info">
                  <h3>Selected Flight</h3>
                  <div className="flight-summary">
                    <Plane size={24} />
                    <div>
                      <strong>
                        {flowState.selectedFlight.offer.itineraries?.[0]?.segments?.[0]?.departure?.iataCode}
                        {' → '}
                        {flowState.selectedFlight.offer.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode}
                      </strong>
                      <p>
                        {flowState.selectedFlight.offer.price?.total} {flowState.selectedFlight.offer.price?.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-flight-selected">
                  <p>No flight selected yet</p>
                  <button
                    className="btn-primary"
                    onClick={() => router.push('/flights/search')}
                  >
                    <Plane size={16} />
                    Search Flights
                  </button>
                </div>
              )}

              <div className="skip-option">
                <p>You can also skip this step and add flights later</p>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="step-content">
              <h2>Review & Create</h2>

              <div className="review-section">
                <h3>Trip Details</h3>
                <dl>
                  <dt>Title:</dt>
                  <dd>{tripDetails.title}</dd>
                  <dt>Dates:</dt>
                  <dd>{format(new Date(tripDetails.start_date), 'MMM d, yyyy')} - {format(new Date(tripDetails.end_date), 'MMM d, yyyy')}</dd>
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

              {flowState.selectedFlight && (
                <div className="review-section">
                  <h3>Flight</h3>
                  <p>1 flight included</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="booking-navigation">
          {currentStep !== 'details' && (
            <button className="btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {currentStep !== 'review' ? (
            <button className="btn-primary" onClick={handleNext}>
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleCreateBooking}
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Create Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


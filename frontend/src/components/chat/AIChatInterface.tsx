import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Send, Bot, User, Loader2, Plane, Hotel, Calendar, Users, X, MapPin, Mountain, Building2, Palmtree } from 'lucide-react';
import './AIChatInterface.css';

// Utility function to format message timestamp intelligently
const formatMessageTime = (timestamp: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Same day: show time only
  if (messageDate.getTime() === today.getTime()) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Yesterday: show "Yesterday" + time
  if (messageDate.getTime() === yesterday.getTime()) {
    return `Yesterday ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Older: show date + time
  const dateStr = timestamp.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric', 
    year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
  return `${dateStr} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: Array<{
    name: string;
    arguments: any;
    result?: any;
  }>;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  onBookingCreated?: (bookingId: string) => void;
  onClose?: () => void;
  conversationId?: string | null;
}

interface StarterFormData {
  type: 'flight' | 'trip' | 'safari' | 'beach' | 'mountain' | 'city';
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  duration?: number;
}

interface StarterFormModalProps {
  formData: StarterFormData;
  onSubmit: (data: StarterFormData) => void;
  onClose: () => void;
}

const StarterFormModal: React.FC<StarterFormModalProps> = ({ formData, onSubmit, onClose }) => {
  const [localData, setLocalData] = useState<StarterFormData>(formData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(localData);
  };

  const updateField = (field: keyof StarterFormData, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const formConfig: Record<StarterFormData['type'], { title: string; icon: React.ReactNode; fields: Array<keyof StarterFormData> }> = {
    flight: {
      title: 'Book a Flight',
      icon: <Plane size={24} />,
      fields: ['origin', 'destination', 'departureDate', 'returnDate', 'passengers']
    },
    trip: {
      title: 'Plan a Trip',
      icon: <Hotel size={24} />,
      fields: ['destination', 'departureDate', 'duration', 'passengers']
    },
    safari: {
      title: 'Safari Adventure',
      icon: <MapPin size={24} />,
      fields: ['departureDate', 'duration', 'passengers']
    },
    beach: {
      title: 'Beach Getaway',
      icon: <Palmtree size={24} />,
      fields: ['destination', 'departureDate', 'duration', 'passengers']
    },
    mountain: {
      title: 'Mountain Retreat',
      icon: <Mountain size={24} />,
      fields: ['destination', 'departureDate', 'passengers']
    },
    city: {
      title: 'City Break',
      icon: <Building2 size={24} />,
      fields: ['destination', 'departureDate', 'passengers']
    }
  };

  const config = formConfig[formData.type];

  const fieldLabels: Record<string, string> = {
    origin: 'From (City or Airport)',
    destination: 'To (Destination)',
    departureDate: 'Departure Date',
    returnDate: 'Return Date (optional)',
    passengers: 'Number of Passengers',
    duration: 'Duration (nights)'
  };

  const fieldPlaceholders: Record<string, string> = {
    origin: 'e.g., New York',
    destination: formData.type === 'beach' ? 'e.g., Maldives' : formData.type === 'mountain' ? 'e.g., Swiss Alps' : 'e.g., Paris',
    departureDate: '',
    returnDate: '',
    passengers: '2',
    duration: '5'
  };

  return (
    <div className="starter-form-overlay" onClick={onClose}>
      <div className="starter-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="starter-form-header">
          <div className="starter-form-title">
            <div className="starter-form-icon">{config.icon}</div>
            <h3>{config.title}</h3>
          </div>
          <button onClick={onClose} className="starter-form-close" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="starter-form-content">
          {config.fields.map((field) => (
            <div key={field} className="form-field">
              <label htmlFor={field}>{fieldLabels[field]}</label>
              {field === 'departureDate' || field === 'returnDate' ? (
                <input
                  type="date"
                  id={field}
                  value={localData[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              ) : field === 'passengers' || field === 'duration' ? (
                <input
                  type="number"
                  id={field}
                  value={localData[field] || ''}
                  onChange={(e) => updateField(field, parseInt(e.target.value) || '')}
                  min="1"
                  placeholder={fieldPlaceholders[field]}
                  className="form-input"
                />
              ) : (
                <input
                  type="text"
                  id={field}
                  value={localData[field] || ''}
                  onChange={(e) => updateField(field, e.target.value)}
                  placeholder={fieldPlaceholders[field]}
                  className="form-input"
                />
              )}
            </div>
          ))}

          <div className="starter-form-actions">
            <button type="button" onClick={onClose} className="form-btn form-btn-cancel">
              Cancel
            </button>
            <button type="submit" className="form-btn form-btn-submit">
              <Send size={16} />
              Create Booking Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onBookingCreated, onClose, conversationId: propConversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const [showStarterForm, setShowStarterForm] = useState<StarterFormData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef<boolean>(false);
  const initializingRef = useRef<boolean>(false);
  const lastPropConversationIdRef = useRef<string | null | undefined>(propConversationId);

  // Initialize conversation or load existing
  useEffect(() => {
    // Skip if already initialized and propConversationId hasn't changed
    if (initializedRef.current && propConversationId === lastPropConversationIdRef.current) {
      return;
    }

    // Skip if initialization is already in progress
    if (initializingRef.current) {
      return;
    }

    // Mark initialization as in progress
    initializingRef.current = true;
    lastPropConversationIdRef.current = propConversationId;

    // Helper function to transform API messages to component Message format
    const transformMessages = (apiMessages: any[]): Message[] => {
      return apiMessages.map((msg: any) => {
        // Transform tool_calls: API uses 'input', component expects 'arguments'
        const tool_calls = msg.tool_calls?.map((tc: any) => ({
          name: tc.name || '',
          arguments: tc.input || tc.arguments || {},
          result: tc.result || null,
        })) || undefined;

        return {
          id: msg.id || `msg-${Date.now()}-${Math.random()}`,
          role: msg.role || 'user',
          content: msg.content || '',
          tool_calls,
          timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
        };
      });
    };

    const initConversation = async () => {
      try {
        // If conversationId is provided as prop, load it
        if (propConversationId) {
          const convData = await api.getConversation(propConversationId);
          setConversationId(propConversationId);
          
          // Load and transform messages from API
          if (convData?.messages && Array.isArray(convData.messages)) {
            const transformedMessages = transformMessages(convData.messages);
            setMessages(transformedMessages);
          } else {
            // Fallback if no messages
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: 'Welcome back. How can I assist you with your booking today?',
              timestamp: new Date(),
            }]);
          }
          
          initializedRef.current = true;
          initializingRef.current = false;
          return;
        }

        // No propConversationId provided - check for existing active conversation first
        const conversationsData = await api.getConversations();
        const conversations = conversationsData?.conversations || [];
        
        // Filter and sort: get active conversations, sorted by updated_at descending
        const activeConversations = conversations
          .filter((conv: any) => 
            conv.status === 'active' || 
            conv.status === 'lead' || 
            conv.stage === 'lead' || 
            conv.stage === 'qualified' || 
            conv.stage === 'booking_in_progress'
          )
          .sort((a: any, b: any) => {
            // Sort by updated_at descending (most recent first)
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
          });
        
        if (activeConversations.length > 0) {
          // Use the most recent active conversation
          const activeConversation = activeConversations[0];
          setConversationId(activeConversation.id);
          
          // Load messages for this conversation
          try {
            const convData = await api.getConversation(activeConversation.id);
            if (convData?.messages && Array.isArray(convData.messages)) {
              const transformedMessages = transformMessages(convData.messages);
              setMessages(transformedMessages);
            } else {
              // Fallback if no messages
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: '👋 Continuing our conversation. How can I help you with your booking?',
                timestamp: new Date(),
              }]);
            }
          } catch (error) {
            console.error('Error loading conversation messages:', error);
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: '👋 Continuing our conversation. How can I help you with your booking?',
              timestamp: new Date(),
            }]);
          }
          
          initializedRef.current = true;
          initializingRef.current = false;
        } else {
          // No active conversation found, create a new one
          // Double-check we haven't already initialized (race condition protection)
          if (!initializedRef.current) {
            const response = await api.createConversation('Start new conversation');
            setConversationId(response.conversation_id);
            initializedRef.current = true;
            initializingRef.current = false;
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              content: 'Welcome to the AI Booking Assistant. I can help you create and manage travel bookings efficiently.\n\nPlease provide details about your trip including destination, dates, number of travelers, and any specific requirements.',
              timestamp: new Date(),
            }]);
          } else {
            initializingRef.current = false;
          }
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
        initializingRef.current = false;
        if (!initializedRef.current) {
          setMessages([{
            id: 'error',
            role: 'system',
            content: 'Unable to start conversation. Please try again.',
            timestamp: new Date(),
          }]);
        }
      }
    };
    
    initConversation();

    // Cleanup function to reset initialization flag if propConversationId changes
    return () => {
      // Only reset if propConversationId actually changed (not just on unmount)
      if (propConversationId !== lastPropConversationIdRef.current) {
        initializedRef.current = false;
      }
    };
  }, [propConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('Sending message to API:', { conversationId, message });
      try {
        const response = await api.sendChatMessage(conversationId, message);
        console.log('API response received:', response);
        return response;
      } catch (error: any) {
        console.error('Error sending message to API:', error);
        throw error;
      }
    },
    onSuccess: (response) => {
      try {
        console.log('Message sent successfully:', response);
        
        // Validate response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format from server');
        }
        
        // Update conversation ID from response (important: maintains conversation session)
        if (response.conversation_id && response.conversation_id !== conversationId) {
          console.log('Updating conversation ID:', response.conversation_id);
          setConversationId(response.conversation_id);
        }

        // Add user message
        setMessages(prev => [...prev, {
          id: `user-${Date.now()}`,
          role: 'user',
          content: input,
          timestamp: new Date(),
        }]);

        // Add assistant response (with fallbacks for missing fields)
        setMessages(prev => [...prev, {
          id: response.message_id || `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.response || 'No response received',
          tool_calls: response.tool_calls || [],
          timestamp: new Date(),
        }]);

        setInput('');
        inputRef.current?.focus();

        // Check if booking was created
        if (response.tool_calls?.some(tc => tc.name === 'finalize_booking' && tc.result?.booking_id)) {
          const bookingId = response.tool_calls.find(tc => tc.name === 'finalize_booking')?.result?.booking_id;
          if (bookingId && onBookingCreated) {
            setTimeout(() => {
              onBookingCreated(bookingId);
            }, 1000);
          }
        }
      } catch (error: any) {
        console.error('Error processing successful response:', error);
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error processing response: ${error.message || 'Unknown error'}`,
          timestamp: new Date(),
        }]);
      }
    },
    onError: (error: Error) => {
      console.error('Error in sendMessageMutation:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${error.message || 'Failed to send message. Please try again.'}`,
        timestamp: new Date(),
      }]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) {
      console.log('Cannot send message:', { input: input.trim(), isPending: sendMessageMutation.isPending });
      return;
    }
    
    // Even if conversationId is null, the API will create a new conversation
    // But let's log it for debugging
    if (!conversationId) {
      console.log('Sending message without conversationId - API will create new conversation');
    }
    
    console.log('Calling sendMessageMutation.mutate');
    sendMessageMutation.mutate(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleStarterPromptClick = (type: StarterFormData['type']) => {
    setShowStarterForm({ type });
  };

  const handleStarterFormSubmit = (formData: StarterFormData) => {
    let prompt = '';

    switch (formData.type) {
      case 'flight':
        prompt = `I need to book a flight from ${formData.origin || '[origin]'} to ${formData.destination || '[destination]'}`;
        if (formData.departureDate) prompt += ` departing on ${formData.departureDate}`;
        if (formData.returnDate) prompt += ` and returning on ${formData.returnDate}`;
        if (formData.passengers) prompt += ` for ${formData.passengers} passenger${formData.passengers > 1 ? 's' : ''}`;
        break;

      case 'trip':
        prompt = `Plan a ${formData.duration || 5}-day vacation to ${formData.destination || '[destination]'}`;
        if (formData.departureDate) prompt += ` starting ${formData.departureDate}`;
        if (formData.passengers) prompt += ` for ${formData.passengers} traveler${formData.passengers > 1 ? 's' : ''}`;
        break;

      case 'safari':
        prompt = `Create a Kenya safari booking`;
        if (formData.duration) prompt += ` for ${formData.duration} days`;
        if (formData.passengers) prompt += ` for ${formData.passengers} people`;
        if (formData.departureDate) prompt += ` starting ${formData.departureDate}`;
        break;

      case 'beach':
        prompt = `I want to book a beach resort in ${formData.destination || 'Maldives'}`;
        if (formData.duration) prompt += ` for ${formData.duration} days`;
        if (formData.passengers) prompt += ` for ${formData.passengers} people`;
        if (formData.departureDate) prompt += ` starting ${formData.departureDate}`;
        break;

      case 'mountain':
        prompt = `Plan a ski trip to ${formData.destination || 'the Alps'}`;
        if (formData.passengers) prompt += ` for ${formData.passengers} people`;
        if (formData.departureDate) prompt += ` starting ${formData.departureDate}`;
        break;

      case 'city':
        prompt = `Book a weekend city break to ${formData.destination || 'Paris'}`;
        if (formData.passengers) prompt += ` for ${formData.passengers} people`;
        if (formData.departureDate) prompt += ` starting ${formData.departureDate}`;
        break;
    }

    setInput(prompt);
    setShowStarterForm(null);
    inputRef.current?.focus();

    // Auto-submit the message
    setTimeout(() => {
      if (prompt.trim()) {
        sendMessageMutation.mutate(prompt);
      }
    }, 100);
  };

  const starterPrompts = [
    { icon: <Plane size={20} />, title: 'Book a Flight', type: 'flight' as const },
    { icon: <Hotel size={20} />, title: 'Plan a Trip', type: 'trip' as const },
    { icon: <MapPin size={20} />, title: 'Safari Adventure', type: 'safari' as const },
    { icon: <Palmtree size={20} />, title: 'Beach Getaway', type: 'beach' as const },
    { icon: <Mountain size={20} />, title: 'Mountain Retreat', type: 'mountain' as const },
    { icon: <Building2 size={20} />, title: 'City Break', type: 'city' as const }
  ];

  const showStarterPrompts = messages.length === 1 && messages[0].id === 'welcome';

  // Format flight search results
  const renderFlightResults = (result: any) => {
    if (!result || !result.offers || !Array.isArray(result.offers)) {
      return <div className="tool-call-result-text">No flights found</div>;
    }

    const offers = result.offers.slice(0, 5); // Show top 5

    return (
      <div className="flight-results-container">
        <div className="flight-results-header">
          <Plane size={18} />
          <span>Found {result.count || offers.length} flight{result.count !== 1 ? 's' : ''}</span>
        </div>
        <div className="flight-results-list">
          {offers.map((offer: any, index: number) => {
            const offerData = offer.full_offer || offer;
            const itinerary = offerData.itineraries?.[0];
            const segment = itinerary?.segments?.[0];
            const price = offerData.price || offer.price || {};
            const departure = segment?.departure || {};
            const arrival = segment?.arrival || {};
            
            // Format time
            const formatTime = (dateStr: string) => {
              if (!dateStr) return '';
              try {
                const date = new Date(dateStr);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              } catch {
                return dateStr;
              }
            };

            // Format duration
            const formatDuration = (duration: string) => {
              if (!duration) return '';
              const match = duration.match(/PT(\d+)H(?:(\d+)M)?/);
              if (match) {
                const hours = match[1];
                const minutes = match[2] || '0';
                return `${hours}h ${minutes}m`;
              }
              return duration;
            };

            return (
              <div key={offer.offer_id || index} className="flight-result-card">
                <div className="flight-result-main">
                  <div className="flight-result-airline">
                    <Plane size={16} />
                    <span>{offer.carrier || segment?.carrierCode || 'Airline'} {offer.flight_number || segment?.number || ''}</span>
                  </div>
                  <div className="flight-result-route">
                    <div className="flight-route-time">
                      <span className="flight-time">{formatTime(departure.at)}</span>
                      <span className="flight-airport">{departure.iataCode || ''}</span>
                    </div>
                    <div className="flight-route-arrow">→</div>
                    <div className="flight-route-time">
                      <span className="flight-time">{formatTime(arrival.at)}</span>
                      <span className="flight-airport">{arrival.iataCode || ''}</span>
                    </div>
                  </div>
                  <div className="flight-result-details">
                    <span className="flight-duration">{formatDuration(itinerary?.duration || offer.duration)}</span>
                    {segment?.numberOfStops === 0 && <span className="flight-nonstop">Non-stop</span>}
                  </div>
                </div>
                <div className="flight-result-price">
                  <span className="price-amount">{price.total || offer.price || 'N/A'}</span>
                  <span className="price-currency">{price.currency || 'EUR'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Format hotel search results
  const renderHotelResults = (result: any) => {
    if (!result || !result.hotels || !Array.isArray(result.hotels)) {
      return <div className="tool-call-result-text">No hotels found</div>;
    }

    const hotels = result.hotels.slice(0, 5);

    return (
      <div className="hotel-results-container">
        <div className="hotel-results-header">
          <Hotel size={18} />
          <span>Found {hotels.length} hotel{hotels.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="hotel-results-list">
          {hotels.map((hotel: any, index: number) => (
            <div key={hotel.hotel_id || index} className="hotel-result-card">
              <div className="hotel-result-name">{hotel.name || 'Hotel'}</div>
              {hotel.rating && (
                <div className="hotel-result-rating">⭐ {hotel.rating}/5</div>
              )}
              {hotel.price && (
                <div className="hotel-result-price">{hotel.price}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Format message text with enhanced markdown-like formatting
  const formatMessageText = (text: string): React.ReactNode => {
    if (!text) return '';
    
    const lines = text.split('\n');
    const formatted: React.ReactNode[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Handle empty lines - add spacing between sections
      if (!trimmed) {
        // Only add spacing if there's content before and after
        if (i > 0 && i < lines.length - 1 && lines[i - 1].trim() && lines[i + 1].trim()) {
          formatted.push(<div key={`spacer-${i}`} className="message-spacer" />);
        }
        i++;
        continue;
      }
      
      // Numbered list items (1. 2. etc.)
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const listItemContent: React.ReactNode[] = [];
        const itemTitle = numberedMatch[2];
        
        // Collect indented lines that follow this list item (details)
        const details: string[] = [];
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          // Check if it's an indented line (starts with spaces) or empty
          if (nextLine.trim() && (nextLine.startsWith('   ') || nextLine.match(/^\s{2,}/))) {
            details.push(nextLine.trim());
            j++;
          } else if (!nextLine.trim()) {
            // Empty line - check if there's more content after
            j++;
          } else {
            // Next non-indented line - stop collecting details
            break;
          }
        }
        
        // Format the list item with details
        listItemContent.push(
          <div key={`item-${i}`} className="message-list-item-header">
            <span className="list-number">{numberedMatch[1]}.</span>
            <span className="list-item-title">{itemTitle}</span>
          </div>
        );
        
        // Add formatted details if any
        if (details.length > 0) {
          const detailsContent = details.map((detail, idx) => {
            // Detect flight details patterns
            const departMatch = detail.match(/Depart:\s*(.+)/i);
            const arriveMatch = detail.match(/Arrive:\s*(.+)/i);
            const priceMatch = detail.match(/Price:\s*(.+)/i);
            
            if (departMatch) {
              return (
                <div key={idx} className="message-list-detail">
                  <span className="detail-label">Depart:</span>
                  <span className="detail-value">{departMatch[1]}</span>
                </div>
              );
            }
            
            if (arriveMatch) {
              return (
                <div key={idx} className="message-list-detail">
                  <span className="detail-label">Arrive:</span>
                  <span className="detail-value">{arriveMatch[1]}</span>
                </div>
              );
            }
            
            if (priceMatch) {
              return (
                <div key={idx} className="message-list-detail">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value price-value">{priceMatch[1]}</span>
                </div>
              );
            }
            
            // Regular detail line
            return (
              <div key={idx} className="message-list-detail">
                {detail}
              </div>
            );
          });
          
          listItemContent.push(
            <div key={`details-${i}`} className="message-list-item-details">
              {detailsContent}
            </div>
          );
        }
        
        formatted.push(
          <div key={i} className="message-list-item-container">
            {listItemContent}
          </div>
        );
        
        i = j; // Skip the lines we've processed
        continue;
      }
      
      // Bold text (text wrapped in **)
      if (trimmed.includes('**')) {
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        formatted.push(
          <div key={i} className="message-paragraph">
            {parts.map((part, idx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
              }
              return <span key={idx}>{part}</span>;
            })}
          </div>
        );
        i++;
        continue;
      }
      
      // Regular paragraph
      formatted.push(
        <div key={i} className="message-paragraph">
          {trimmed}
        </div>
      );
      i++;
    }
    
    return formatted.length > 0 ? <>{formatted}</> : text;
  };

  const renderToolCall = (toolCall: { name: string; arguments: any; result?: any }) => {
    const icons: Record<string, React.ReactNode> = {
      search_flights: <Plane size={16} />,
      search_hotels: <Hotel size={16} />,
      create_booking: <Calendar size={16} />,
      add_flight_to_booking: <Plane size={16} />,
      add_hotel_to_booking: <Hotel size={16} />,
      add_traveler: <Users size={16} />,
      finalize_booking: <Users size={16} />,
    };

    const getFormattedResult = () => {
      if (!toolCall.result) return null;

      // Handle flight search results
      if (toolCall.name === 'search_flights') {
        return renderFlightResults(toolCall.result);
      }

      // Handle hotel search results
      if (toolCall.name === 'search_hotels') {
        return renderHotelResults(toolCall.result);
      }

      // Handle booking creation
      if (toolCall.name === 'create_booking' && toolCall.result.success) {
        return (
          <div className="tool-call-success">
            ✅ Booking created: {toolCall.result.booking_id || 'Success'}
          </div>
        );
      }

      // Handle flight/hotel added
      if ((toolCall.name === 'add_flight_to_booking' || toolCall.name === 'add_hotel_to_booking') && toolCall.result.success) {
        return (
          <div className="tool-call-success">
            ✅ {toolCall.name === 'add_flight_to_booking' ? 'Flight' : 'Hotel'} added successfully
          </div>
        );
      }

      // Handle traveler added
      if (toolCall.name === 'add_traveler' && toolCall.result.success) {
        return (
          <div className="tool-call-success">
            ✅ Traveler added: {toolCall.result.traveler_name || 'Success'}
          </div>
        );
      }

      // Default: show as formatted JSON or string
      if (typeof toolCall.result === 'string') {
        return <div className="tool-call-result-text">{toolCall.result}</div>;
      }

      // For complex objects, show a summary if available
      if (toolCall.result.success !== undefined) {
        return (
          <div className={toolCall.result.success ? 'tool-call-success' : 'tool-call-error'}>
            {toolCall.result.success ? '✅' : '❌'} {toolCall.result.message || (toolCall.result.success ? 'Success' : 'Failed')}
          </div>
        );
      }

      // Fallback to JSON (but make it more readable)
      return (
        <div className="tool-call-result-json">
          <pre>{JSON.stringify(toolCall.result, null, 2)}</pre>
        </div>
      );
    };

    return (
      <div className="tool-call" key={toolCall.name}>
        <div className="tool-call-header">
          {icons[toolCall.name] || <Bot size={16} />}
          <span className="tool-call-name">{toolCall.name.replace(/_/g, ' ')}</span>
        </div>
        {getFormattedResult()}
      </div>
    );
  };

  return (
    <div className="ai-chat-interface">
      <div className="chat-header">
        <div className="chat-header-content">
          <Bot size={20} className="chat-header-icon" />
          <div>
            <h3>AI Booking Assistant</h3>
            <p className="chat-header-subtitle">Create bookings through conversation</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="chat-close-btn">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? (
                <User size={18} />
              ) : message.role === 'assistant' ? (
                <Bot size={18} />
              ) : null}
            </div>
            <div className="message-content">
              <div className="message-text">{formatMessageText(message.content)}</div>
              {message.tool_calls && message.tool_calls.length > 0 && (
                <div className="message-tool-calls">
                  {message.tool_calls.map((tc, idx) => (
                    <div key={idx}>{renderToolCall(tc)}</div>
                  ))}
                </div>
              )}
              <div className="message-time">
                {formatMessageTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {sendMessageMutation.isPending && (
          <div className="message message-assistant">
            <div className="message-avatar">
              <Bot size={18} />
            </div>
            <div className="message-content">
              <div className="message-text">
                <Loader2 size={16} className="animate-spin" />
                <span style={{ marginLeft: '8px' }}>Processing...</span>
              </div>
            </div>
          </div>
        )}

        {showStarterPrompts && (
          <div className="starter-prompts-container">
            <div className="starter-prompts-header">
              <h4>✨ Try one of these to get started:</h4>
            </div>
            <div className="starter-prompts-grid">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  className="starter-prompt-card"
                  onClick={() => handleStarterPromptClick(prompt.type)}
                  type="button"
                >
                  <div className="starter-prompt-icon">{prompt.icon}</div>
                  <div className="starter-prompt-title">{prompt.title}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Starter Form Modal */}
        {showStarterForm && (
          <StarterFormModal
            formData={showStarterForm}
            onSubmit={handleStarterFormSubmit}
            onClose={() => setShowStarterForm(null)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your booking request... (e.g., 'Book a safari to Kenya for 2 travelers, departing March 15')"
          className="chat-input"
          rows={1}
          disabled={sendMessageMutation.isPending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMessageMutation.isPending}
          className="chat-send-btn"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
};


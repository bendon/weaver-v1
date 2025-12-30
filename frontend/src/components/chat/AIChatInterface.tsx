import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Send, Bot, User, Loader2, Plane, Hotel, Calendar, Users, X, MapPin, Mountain, Building2, Palmtree } from 'lucide-react';
import './AIChatInterface.css';

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

  const formConfig: Record<StarterFormData['type'], { title: string; icon: string; fields: Array<keyof StarterFormData> }> = {
    flight: {
      title: 'Book a Flight',
      icon: '✈️',
      fields: ['origin', 'destination', 'departureDate', 'returnDate', 'passengers']
    },
    trip: {
      title: 'Plan a Trip',
      icon: '🏨',
      fields: ['destination', 'departureDate', 'duration', 'passengers']
    },
    safari: {
      title: 'Safari Adventure',
      icon: '🎯',
      fields: ['departureDate', 'duration', 'passengers']
    },
    beach: {
      title: 'Beach Getaway',
      icon: '🌴',
      fields: ['destination', 'departureDate', 'duration', 'passengers']
    },
    mountain: {
      title: 'Mountain Retreat',
      icon: '🎿',
      fields: ['destination', 'departureDate', 'passengers']
    },
    city: {
      title: 'City Break',
      icon: '🗼',
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
            <span className="starter-form-icon">{config.icon}</span>
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

  // Initialize conversation or load existing
  useEffect(() => {
    // Skip if already initialized for this propConversationId
    if (initializedRef.current && conversationId) {
      // If propConversationId changed, we need to re-initialize
      if (propConversationId && conversationId === propConversationId) {
        return;
      }
      // If no propConversationId and we have a conversationId, don't re-initialize
      if (!propConversationId) {
        return;
      }
    }

    const initConversation = async () => {
      // If conversationId is provided as prop, load it
      if (propConversationId) {
        try {
          const conv = await api.getConversation(propConversationId);
          setConversationId(propConversationId);
          initializedRef.current = true;
          // Load conversation messages if available
          // For now, just show welcome message
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Welcome back. How can I assist you with your booking today?',
            timestamp: new Date(),
          }]);
        } catch (error) {
          console.error('Error loading conversation:', error);
        }
        return;
      }

      // No propConversationId provided - check for existing active conversation first
      try {
        const conversationsData = await api.getConversations();
        const conversations = conversationsData?.conversations || [];
        
        // Find the most recent active/in-progress conversation
        const activeConversation = conversations.find(
          (conv: any) => conv.status === 'active' || conv.status === 'lead' || conv.status === 'in_progress'
        );
        
        if (activeConversation) {
          // Use existing active conversation
          setConversationId(activeConversation.id);
          initializedRef.current = true;
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '👋 Continuing our conversation. How can I help you with your booking?',
            timestamp: new Date(),
          }]);
        } else if (!initializedRef.current) {
          // No active conversation found and not yet initialized, create a new one
          const response = await api.createConversation('Start new conversation');
          setConversationId(response.conversation_id);
          initializedRef.current = true;
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Welcome to the AI Booking Assistant. I can help you create and manage travel bookings efficiently.\n\nPlease provide details about your trip including destination, dates, number of travelers, and any specific requirements.',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Error initializing conversation:', error);
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
  }, [propConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await api.sendChatMessage(conversationId, message);
    },
    onSuccess: (response) => {
      // Update conversation ID from response (important: maintains conversation session)
      if (response.conversation_id && response.conversation_id !== conversationId) {
        setConversationId(response.conversation_id);
      }

      // Add user message
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: new Date(),
      }]);

      // Add assistant response
      setMessages(prev => [...prev, {
        id: response.message_id,
        role: 'assistant',
        content: response.response,
        tool_calls: response.tool_calls,
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
    },
    onError: (error: Error) => {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      }]);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessageMutation.isPending) return;
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
    { icon: '✈️', title: 'Book a Flight', type: 'flight' as const },
    { icon: '🏨', title: 'Plan a Trip', type: 'trip' as const },
    { icon: '🎯', title: 'Safari Adventure', type: 'safari' as const },
    { icon: '🌴', title: 'Beach Getaway', type: 'beach' as const },
    { icon: '🎿', title: 'Mountain Retreat', type: 'mountain' as const },
    { icon: '🗼', title: 'City Break', type: 'city' as const }
  ];

  const showStarterPrompts = messages.length === 1 && messages[0].id === 'welcome';
  const renderToolCall = (toolCall: { name: string; arguments: any; result?: any }) => {
    const icons: Record<string, React.ReactNode> = {
      search_flights: <Plane size={16} />,
      search_hotels: <Hotel size={16} />,
      create_draft_itinerary: <Calendar size={16} />,
      finalize_booking: <Users size={16} />,
    };

    return (
      <div className="tool-call" key={toolCall.name}>
        <div className="tool-call-header">
          {icons[toolCall.name] || <Bot size={16} />}
          <span className="tool-call-name">{toolCall.name.replace(/_/g, ' ')}</span>
        </div>
        {toolCall.result && (
          <div className="tool-call-result">
            {typeof toolCall.result === 'string' 
              ? toolCall.result 
              : JSON.stringify(toolCall.result, null, 2)}
          </div>
        )}
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
              <div className="message-text">{message.content}</div>
              {message.tool_calls && message.tool_calls.length > 0 && (
                <div className="message-tool-calls">
                  {message.tool_calls.map((tc, idx) => (
                    <div key={idx}>{renderToolCall(tc)}</div>
                  ))}
                </div>
              )}
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

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


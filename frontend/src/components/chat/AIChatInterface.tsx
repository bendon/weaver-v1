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

export const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ onBookingCreated, onClose, conversationId: propConversationId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize conversation or load existing
  useEffect(() => {
    const initConversation = async () => {
      // If conversationId is provided, load it
      if (propConversationId) {
        try {
          const conv = await api.getConversation(propConversationId);
          setConversationId(propConversationId);
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
      } else if (!conversationId) {
        // Create new conversation
        try {
          const response = await api.createConversation('Start new conversation');
          setConversationId(response.conversation_id);
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Welcome to the AI Booking Assistant. I can help you create and manage travel bookings efficiently.\n\nPlease provide details about your trip including destination, dates, number of travelers, and any specific requirements.',
            timestamp: new Date(),
          }]);
        } catch (error) {
          console.error('Error creating conversation:', error);
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

  const handleStarterPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const starterPrompts = [
    { icon: <Plane size={20} />, title: 'Book a Flight', prompt: 'I need to book a flight' },
    { icon: <Hotel size={20} />, title: 'Reserve Hotel', prompt: 'I need to reserve a hotel' },
    { icon: <MapPin size={20} />, title: 'Safari Package', prompt: 'I need to create a safari package' },
    { icon: <Palmtree size={20} />, title: 'Beach Getaway', prompt: 'I need to plan a beach getaway' },
    { icon: <Mountain size={20} />, title: 'Mountain Retreat', prompt: 'I need to plan a mountain retreat' },
    { icon: <Building2 size={20} />, title: 'City Tour', prompt: 'I need to organize a city tour' },
  ];
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

        {messages.length <= 1 && !sendMessageMutation.isPending && (
          <div className="starter-prompts-container">
            <div className="starter-prompts-header">
              <h4>Quick Actions</h4>
              <p>Select a template to get started</p>
            </div>
            <div className="starter-prompts-grid">
              {starterPrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="starter-prompt-card"
                  type="button"
                  onClick={() => handleStarterPrompt(prompt.prompt)}
                >
                  <div className="starter-prompt-icon">{prompt.icon}</div>
                  <div className="starter-prompt-title">{prompt.title}</div>
                </button>
              ))}
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


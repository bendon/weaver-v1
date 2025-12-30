import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Search, MessageSquare, Send, Phone, Mail, Filter, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import './MessageCenter.css';

export const MessageCenter: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<'all' | 'whatsapp' | 'sms' | 'email'>('all');

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', selectedBooking, channelFilter],
    queryFn: async () => {
      try {
        return await api.getMessages(selectedBooking || undefined);
      } catch (err) {
        return { messages: [], total: 0 };
      }
    },
  });

  const messages = messagesData?.messages || [];
  const filteredMessages = channelFilter === 'all' 
    ? messages 
    : messages.filter((m: any) => m.channel === channelFilter);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare size={16} />;
      case 'sms':
        return <Phone size={16} />;
      case 'email':
        return <Mail size={16} />;
      default:
        return <MessageSquare size={16} />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return '#25D366';
      case 'sms':
        return '#3b82f6';
      case 'email':
        return '#6366f1';
      default:
        return '#94a3b8';
    }
  };

  return (
    <div className="message-center">
      <div className="message-center-header">
        <div>
          <h1 className="message-center-title">Message Center</h1>
          <p className="message-center-subtitle">View all communications with travelers</p>
        </div>
        <div className="message-center-filters">
          <button
            onClick={() => setChannelFilter('all')}
            className={`filter-btn ${channelFilter === 'all' ? 'active' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setChannelFilter('whatsapp')}
            className={`filter-btn ${channelFilter === 'whatsapp' ? 'active' : ''}`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setChannelFilter('sms')}
            className={`filter-btn ${channelFilter === 'sms' ? 'active' : ''}`}
          >
            SMS
          </button>
          <button
            onClick={() => setChannelFilter('email')}
            className={`filter-btn ${channelFilter === 'email' ? 'active' : ''}`}
          >
            Email
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <p>Loading messages...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="empty-state">
          <MessageSquare size={48} className="empty-icon" />
          <h3>No messages found</h3>
          <p>Messages will appear here once you start communicating with travelers</p>
        </div>
      ) : (
        <div className="messages-list">
          {filteredMessages.map((message: any) => (
            <div key={message.id} className={`message-item message-${message.direction}`}>
              <div className="message-item-header">
                <div className="message-channel" style={{ color: getChannelColor(message.channel) }}>
                  {getChannelIcon(message.channel)}
                  <span className="message-channel-name">{message.channel.toUpperCase()}</span>
                </div>
                <div className="message-meta">
                  <span className="message-booking-code">{message.booking_code || 'N/A'}</span>
                  <span className="message-time">
                    {format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              </div>
              <div className="message-content-text">{message.content}</div>
              <div className="message-status">
                <span className={`status-badge status-${message.status}`}>
                  {message.status}
                </span>
                {message.direction === 'outbound' && message.delivered_at && (
                  <span className="delivered-time">
                    Delivered: {format(new Date(message.delivered_at), 'MMM d, HH:mm')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


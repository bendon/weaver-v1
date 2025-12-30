import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bot, Plus, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { AIChatInterface } from '../components/chat/AIChatInterface';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './AIBookingAssistantView.css';

export default function AIBookingAssistantView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Fetch recent conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      try {
        return await api.getConversations();
      } catch (err) {
        return { conversations: [], total: 0 };
      }
    },
  });

  const conversations = conversationsData?.conversations || [];

  const handleBookingCreated = (bookingId: string) => {
    // Navigate to the booking detail page
    navigate(`/dmc/${bookingId}`);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
  };

  return (
    <div className="ai-booking-assistant-view">
      {/* Sidebar */}
      <div className="assistant-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Bot size={24} />
            <div>
              <h2>AI Assistant</h2>
              <p className="sidebar-subtitle">Booking Workspace</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dmc')}
            className="sidebar-back-btn"
            title="Back to Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <button
            onClick={handleNewConversation}
            className="new-conversation-btn"
          >
            <Plus size={18} />
            New Conversation
          </button>

          <div className="conversations-section">
            <h3 className="section-title">Recent Conversations</h3>
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-conversations">
                  <BookOpen size={32} />
                  <p>No conversations yet</p>
                  <p className="empty-hint">Start a new conversation to begin</p>
                </div>
              ) : (
                conversations.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                  >
                    <div className="conversation-header">
                      <Bot size={16} />
                      <span className="conversation-title">
                        {conv.booking_id ? `Booking: ${conv.booking_id.slice(0, 8)}...` : 'New Conversation'}
                      </span>
                    </div>
                    <div className="conversation-meta">
                      <span className="conversation-status">
                        {conv.status === 'completed' ? (
                          <CheckCircle size={12} className="status-icon completed" />
                        ) : (
                          <Clock size={12} className="status-icon active" />
                        )}
                        {conv.status}
                      </span>
                      <span className="conversation-date">
                        {new Date(conv.created_at).toLocaleDateString()} {new Date(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'User'}</p>
              <p className="user-role">{user?.role || 'Agent'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="assistant-main">
        <div className="chat-container">
          <AIChatInterface
            onBookingCreated={handleBookingCreated}
            conversationId={activeConversationId}
          />
        </div>
      </div>

      {/* Info Panel (Optional - can be toggled) */}
      <div className="assistant-info-panel">
        <div className="info-panel-content">
          <h3>Quick Tips</h3>
          <div className="tips-list">
            <div className="tip-item">
              <div className="tip-icon">💡</div>
              <div>
                <strong>Natural Language</strong>
                <p>Just describe what you need - "I need a Kenya safari for 2 people in March"</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">✈️</div>
              <div>
                <strong>Flight Search</strong>
                <p>The AI can search flights, hotels, and create complete itineraries</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">✅</div>
              <div>
                <strong>Review & Confirm</strong>
                <p>Always review the booking details before finalizing</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">🔄</div>
              <div>
                <strong>Refine Anytime</strong>
                <p>Ask to modify dates, change hotels, or adjust any details</p>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4>Available Tools</h4>
            <div className="tools-list">
              <span className="tool-badge">Flight Search</span>
              <span className="tool-badge">Hotel Search</span>
              <span className="tool-badge">Weather Check</span>
              <span className="tool-badge">Airport Info</span>
              <span className="tool-badge">Create Booking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


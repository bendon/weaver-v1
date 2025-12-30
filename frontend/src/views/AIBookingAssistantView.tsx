import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bot, Plus, BookOpen, Clock, CheckCircle, Filter, Calendar, Tag, MoreVertical, XCircle, AlertCircle, Target, TrendingUp, Sparkles, MessageSquare, Plane, Hotel, CloudSun, MapPin, FileText } from 'lucide-react';
import { AIChatInterface } from '../components/chat/AIChatInterface';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './AIBookingAssistantView.css';

interface AIBookingAssistantViewProps {
  conversationId?: string;
}

// Stage types
type Stage = 'lead' | 'qualified' | 'booking_in_progress' | 'booking_completed' | 'no_sale' | 'follow_up_scheduled';
type Outcome = 'booked' | 'declined' | 'needs_info' | 'no_response' | 'follow_up';

const STAGE_CONFIG: Record<Stage, { label: string; color: string; icon: any }> = {
  lead: { label: 'Lead', color: '#94a3b8', icon: Sparkles },
  qualified: { label: 'Qualified', color: '#3b82f6', icon: Target },
  booking_in_progress: { label: 'In Progress', color: '#f59e0b', icon: TrendingUp },
  booking_completed: { label: 'Completed', color: '#10b981', icon: CheckCircle },
  no_sale: { label: 'No Sale', color: '#ef4444', icon: XCircle },
  follow_up_scheduled: { label: 'Follow-up', color: '#8b5cf6', icon: Calendar },
};

const OUTCOME_OPTIONS: { value: Outcome; label: string }[] = [
  { value: 'booked', label: '✅ Booked' },
  { value: 'declined', label: '❌ Declined' },
  { value: 'needs_info', label: '📋 Needs Info' },
  { value: 'no_response', label: '🔇 No Response' },
  { value: 'follow_up', label: '📅 Follow-up' },
];

export default function AIBookingAssistantView({ conversationId: propConversationId }: AIBookingAssistantViewProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(propConversationId || null);
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all');
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null);
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Update active conversation when prop changes
  useEffect(() => {
    if (propConversationId) {
      setActiveConversationId(propConversationId);
    }
  }, [propConversationId]);

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

  // Update conversation mutation
  const updateConversationMutation = useMutation({
    mutationFn: async ({ conversationId, updates }: { conversationId: string; updates: any }) => {
      return await api.updateConversation(conversationId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowConversationMenu(null);
      setEditingConversation(null);
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
    setShowConversationMenu(null);
  };

  const handleUpdateOutcome = (conversationId: string, outcome: Outcome) => {
    updateConversationMutation.mutate({
      conversationId,
      updates: { outcome },
    });
  };

  const handleScheduleFollowUp = (conversationId: string) => {
    if (!followUpDate) {
      alert('Please select a follow-up date');
      return;
    }
    updateConversationMutation.mutate({
      conversationId,
      updates: {
        follow_up_date: followUpDate,
        follow_up_notes: followUpNotes,
      },
    });
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv: any) => {
    if (stageFilter === 'all') return true;
    return conv.stage === stageFilter;
  });

  // Get follow-ups due
  const followUpsDue = conversations.filter((conv: any) => {
    if (!conv.follow_up_date) return false;
    const followUpDate = new Date(conv.follow_up_date);
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    return followUpDate >= today && followUpDate <= weekFromNow;
  }).sort((a: any, b: any) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime());

  const getStageInfo = (stage: string) => {
    return STAGE_CONFIG[stage as Stage] || STAGE_CONFIG.lead;
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

          {/* Stage Filters */}
          <div className="stage-filters">
            <button
              onClick={() => setStageFilter('all')}
              className={`filter-btn ${stageFilter === 'all' ? 'active' : ''}`}
            >
              <Filter size={14} />
              All ({conversations.length})
            </button>
            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
              const count = conversations.filter((c: any) => c.stage === stage).length;
              const Icon = config.icon;
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage as Stage)}
                  className={`filter-btn ${stageFilter === stage ? 'active' : ''}`}
                  style={{ borderLeftColor: config.color }}
                >
                  <Icon size={14} />
                  {config.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Follow-ups Due */}
          {followUpsDue.length > 0 && (
            <div className="follow-ups-section">
              <h3 className="section-title">
                <AlertCircle size={16} />
                Follow-ups Due ({followUpsDue.length})
              </h3>
              <div className="follow-ups-list">
                {followUpsDue.map((conv: any) => (
                  <div
                    key={conv.id}
                    className="follow-up-item"
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <div className="follow-up-header">
                      <span className="follow-up-title">{conv.title}</span>
                      <span className="follow-up-date">
                        {new Date(conv.follow_up_date).toLocaleDateString()}
                      </span>
                    </div>
                    {conv.follow_up_notes && (
                      <p className="follow-up-notes">{conv.follow_up_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="conversations-section">
            <h3 className="section-title">
              Conversations
              {stageFilter !== 'all' && ` (${filteredConversations.length})`}
            </h3>
            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div className="empty-conversations">
                  <BookOpen size={32} />
                  <p>No conversations</p>
                  <p className="empty-hint">
                    {stageFilter !== 'all'
                      ? `No ${STAGE_CONFIG[stageFilter as Stage]?.label.toLowerCase()} conversations`
                      : 'Start a new conversation to begin'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv: any) => {
                  const stageInfo = getStageInfo(conv.stage);
                  const StageIcon = stageInfo.icon;

                  return (
                    <div
                      key={conv.id}
                      className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                    >
                      <button
                        onClick={() => handleSelectConversation(conv.id)}
                        className="conversation-main"
                      >
                        <div className="conversation-header">
                          <div className="conversation-stage-badge" style={{ backgroundColor: stageInfo.color }}>
                            <StageIcon size={12} />
                          </div>
                          <span className="conversation-title">
                            {conv.title || (conv.booking_id ? `Booking: ${conv.booking_id.slice(0, 8)}...` : 'New Conversation')}
                          </span>
                        </div>
                        <div className="conversation-meta">
                          <span className="conversation-stage-label" style={{ color: stageInfo.color }}>
                            {stageInfo.label}
                          </span>
                          {conv.outcome && (
                            <span className="conversation-outcome">
                              {OUTCOME_OPTIONS.find(o => o.value === conv.outcome)?.label}
                            </span>
                          )}
                          <span className="conversation-date">
                            {new Date(conv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>

                      <button
                        className="conversation-menu-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConversationMenu(showConversationMenu === conv.id ? null : conv.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Conversation Menu */}
                      {showConversationMenu === conv.id && (
                        <div className="conversation-menu">
                          <div className="menu-section">
                            <h4>Set Outcome</h4>
                            {OUTCOME_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleUpdateOutcome(conv.id, option.value)}
                                className={`menu-option ${conv.outcome === option.value ? 'selected' : ''}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="menu-section">
                            <h4>Schedule Follow-up</h4>
                            <input
                              type="date"
                              value={followUpDate}
                              onChange={(e) => setFollowUpDate(e.target.value)}
                              className="menu-input"
                              min={new Date().toISOString().split('T')[0]}
                            />
                            <textarea
                              placeholder="Follow-up notes..."
                              value={followUpNotes}
                              onChange={(e) => setFollowUpNotes(e.target.value)}
                              className="menu-textarea"
                              rows={2}
                            />
                            <button
                              onClick={() => handleScheduleFollowUp(conv.id)}
                              className="menu-save-btn"
                            >
                              Save Follow-up
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
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
          <h3>Assistant Capabilities</h3>
          <div className="tips-list">
            <div className="tip-item">
              <div className="tip-icon">
                <MessageSquare size={18} />
              </div>
              <div>
                <strong>Natural Language Processing</strong>
                <p>Communicate your requirements in plain language for intelligent booking assistance</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">
                <Plane size={18} />
              </div>
              <div>
                <strong>Comprehensive Search</strong>
                <p>Access real-time flight, hotel, and itinerary search capabilities</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">
                <FileText size={18} />
              </div>
              <div>
                <strong>Verification Process</strong>
                <p>Review all booking details and pricing before confirmation</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">
                <Bot size={18} />
              </div>
              <div>
                <strong>Dynamic Modifications</strong>
                <p>Request changes to dates, accommodations, or itinerary at any time</p>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h4>Available Services</h4>
            <div className="tools-list">
              <span className="tool-badge"><Plane size={12} /> Flight Booking</span>
              <span className="tool-badge"><Hotel size={12} /> Accommodation</span>
              <span className="tool-badge"><CloudSun size={12} /> Weather Data</span>
              <span className="tool-badge"><MapPin size={12} /> Location Info</span>
              <span className="tool-badge"><FileText size={12} /> Documentation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


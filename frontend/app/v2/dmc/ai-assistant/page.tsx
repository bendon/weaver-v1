'use client'

import { Send, Sparkles, User, Bot, Plus, Search, MoreVertical, Calendar, Tag, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '@/v2/lib/api'

// Client-side only time formatter to avoid hydration mismatches
function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const displayMinutes = minutes.toString().padStart(2, '0')
  return `${displayHours}:${displayMinutes} ${ampm}`
}

// Client-side only component for displaying current time
function CurrentTime() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    // Only set time on client side
    setTime(formatTime(new Date()))
  }, [])

  if (!time) return null
  return <>{time}</>
}

interface Conversation {
  conversation_id: string
  title?: string
  stage?: string
  outcome?: string
  status?: string
  booking_id?: string
  booking_code?: string
  traveler_name?: string
  created_at: string
  updated_at: string
  follow_up_date?: string
  tags?: string
  last_message?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  response?: {
    template?: string
    data?: any
    actions?: Array<{
      type: string
      label: string
      action: string
      data?: any
    }>
    status?: string
  }
}

export default function AIAssistantPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch conversations on mount
  useEffect(() => {
    // Check if user is authenticated before making API calls
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      loadConversations()
    }
  }, [])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadConversationMessages(selectedConversationId)
    } else {
      setMessages([])
    }
  }, [selectedConversationId])

  const loadConversations = async () => {
    // Check for auth token first
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      console.log('No auth token found, skipping conversations load')
      return
    }

    try {
      const response = await apiClient.conversations.list()
      if (response.success && response.data) {
        // Normalize conversation data: map 'id' to 'conversation_id' if needed
        const normalizedConversations = response.data.map((conv: any) => ({
          ...conv,
          conversation_id: conv.conversation_id || conv.id || conv._id,
        }))
        setConversations(normalizedConversations)
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error)
      // If it's an auth error, the API client will handle redirect
      // For other errors, just log them
    }
  }

  const loadConversationMessages = async (conversationId: string) => {
    // Check for auth token first
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      console.log('No auth token found, skipping messages load')
      return
    }

    setLoadingMessages(true)
    try {
      console.log('Loading messages for conversation:', conversationId)
      const response = await apiClient.conversations.get(conversationId)
      console.log('Conversation response:', response)
      
      if (response.success && response.data) {
        // Handle both possible response structures
        const messagesData = response.data.messages || response.data.conversation?.messages || []
        
        if (Array.isArray(messagesData) && messagesData.length > 0) {
          const transformedMessages = messagesData.map((msg: any, index: number) => ({
            id: msg.id || msg.message_id || `msg-${Date.now()}-${index}`,
            role: msg.role,
            content: msg.content || msg.message || '',
            timestamp: msg.created_at ? formatTime(msg.created_at) : 'Now',
          }))
          setMessages(transformedMessages)
        } else {
          console.log('No messages found in response, setting empty array')
          setMessages([])
        }
      } else {
        console.warn('Response was not successful or missing data:', response)
        setMessages([])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleNewConversation = async () => {
    setSelectedConversationId(null)
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m WeaverAssistant, your AI travel planning companion. How can I help you today?',
      timestamp: formatTime(new Date()),
    }])
    setMessage('')
  }

  const handleSend = async () => {
    if (!message.trim()) return

    // Check for auth token first
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!token) {
      // Redirect to login if no token
      if (typeof window !== 'undefined') {
        window.location.href = '/v2/auth/login'
      }
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: formatTime(new Date()),
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const response = await apiClient.conversations.sendMessage(selectedConversationId, message)

      if (response.success) {
        // V2 API returns response directly in the response object, not in response.data
        const responseData: any = response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseData.response?.message || 'I apologize, but I didn\'t receive a proper response.',
          timestamp: formatTime(new Date()),
          response: responseData.response, // Include full response data for rendering
        }

        setMessages(prev => [...prev, assistantMessage])

        // Update selected conversation ID if it was a new conversation
        if (!selectedConversationId && responseData.conversation_id) {
          setSelectedConversationId(responseData.conversation_id)
        }

        // Reload conversations to get updated list
        loadConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: formatTime(new Date()),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const getStageBadge = (stage?: string) => {
    if (!stage) return null
    
    const stageMap: Record<string, { label: string; class: string }> = {
      lead: { label: 'Lead', class: 'badge-upcoming' },
      qualified: { label: 'Qualified', class: 'badge-active' },
      booking_in_progress: { label: 'In Progress', class: 'badge-active' },
      booking_completed: { label: 'Booked', class: 'badge-completed' },
      no_sale: { label: 'No Sale', class: 'badge-draft' },
      follow_up_scheduled: { label: 'Follow-up', class: 'badge-upcoming' },
    }

    const stageInfo = stageMap[stage] || { label: stage, class: 'badge-draft' }
    return (
      <span className={`badge text-xs ${stageInfo.class}`}>
        {stageInfo.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.traveler_name?.toLowerCase().includes(query) ||
      conv.booking_code?.toLowerCase().includes(query) ||
      conv.last_message?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-default bg-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-default">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <button
              onClick={handleNewConversation}
              className="btn-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              New
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-tertiary">
              {searchQuery ? 'No conversations found' : 'No conversations yet. Start a new one!'}
            </div>
          ) : (
            <div className="divide-y divide-default">
              {filteredConversations.map((conv, index) => (
                <div
                  key={conv.conversation_id || `conv-${index}`}
                  onClick={() => {
                    console.log('Conversation clicked:', conv.conversation_id, conv)
                    if (conv.conversation_id) {
                      setSelectedConversationId(conv.conversation_id)
                    } else {
                      console.warn('Conversation missing conversation_id:', conv)
                    }
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedConversationId === conv.conversation_id
                      ? 'bg-subtle border-l-2 border-l-black'
                      : 'hover:bg-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate mb-1">
                        {conv.title || conv.traveler_name || 'New Conversation'}
                      </div>
                      {conv.traveler_name && (
                        <div className="text-xs text-secondary mb-1">
                          {conv.traveler_name}
                          {conv.booking_code && ` · ${conv.booking_code}`}
                        </div>
                      )}
                      {conv.last_message && (
                        <div className="text-xs text-tertiary truncate">
                          {conv.last_message}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {getStageBadge(conv.stage)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {conv.outcome && (
                      <span className="text-xs text-tertiary flex items-center gap-1">
                        {conv.outcome === 'booked' ? (
                          <CheckCircle size={12} className="text-green-600" />
                        ) : conv.outcome === 'declined' ? (
                          <XCircle size={12} className="text-red-600" />
                        ) : (
                          <Clock size={12} />
                        )}
                        {conv.outcome}
                      </span>
                    )}
                    {conv.follow_up_date && (
                      <span className="text-xs text-tertiary flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(conv.follow_up_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {conv.tags && (
                      <span className="text-xs text-tertiary flex items-center gap-1">
                        <Tag size={12} />
                        {conv.tags}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-tertiary mt-2">
                    {formatDate(conv.updated_at || conv.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-default bg-white">
          <div className="px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">WeaverAssistant</h1>
                <p className="text-sm text-secondary">AI-powered travel planning companion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-subtle">
          {loadingMessages ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-black">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="card p-4 max-w-2xl">
                    <div className="text-sm text-tertiary">Loading messages...</div>
                  </div>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-black">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="card p-4 max-w-2xl">
                    <div className="text-sm whitespace-pre-wrap">
                      {selectedConversationId 
                        ? 'No messages in this conversation yet.'
                        : 'Hello! I\'m WeaverAssistant, your AI travel planning companion. How can I help you today?'}
                    </div>
                  </div>
                  <div className="text-xs text-tertiary mt-1">
                    <CurrentTime />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      msg.role === 'assistant' ? 'bg-black' : 'bg-subtle'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <Bot size={20} className="text-white" />
                    ) : (
                      <User size={20} className="text-secondary" />
                    )}
                  </div>

                  {/* Message */}
                  <div className={`flex-1 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={`card p-4 max-w-2xl ${
                        msg.role === 'user' ? 'bg-subtle' : ''
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>

                      {/* Render action buttons if present */}
                      {msg.response?.actions && msg.response.actions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {msg.response.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickAction(action.action, action.data)}
                              className="btn-secondary px-4 py-2 text-sm rounded-lg border border-default hover:bg-subtle transition-colors"
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-tertiary mt-1">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-black">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="card p-4 max-w-2xl">
                      <div className="text-sm text-tertiary">Thinking...</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-default bg-white">
          <div className="px-8 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask WeaverAssistant anything..."
                  className="input-field flex-1"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !message.trim()}
                  className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
              <div className="text-xs text-tertiary mt-2 text-center">
                WeaverAssistant can help with itineraries, bookings, traveler questions, and trip management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

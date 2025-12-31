'use client'

import { Send, Sparkles, User, Bot } from 'lucide-react'
import { useState } from 'react'

export default function AIAssistantPage() {
  const [message, setMessage] = useState('')

  const conversations = [
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m WeaverAssistant, your AI travel planning companion. How can I help you today?',
      timestamp: '2:30 PM'
    },
    {
      id: 2,
      role: 'user',
      content: 'I need to create a 7-day itinerary for Sarah Chen\'s upcoming Tokyo trip starting March 15th.',
      timestamp: '2:31 PM'
    },
    {
      id: 3,
      role: 'assistant',
      content: `I'll help you create a comprehensive 7-day Tokyo itinerary for Sarah Chen. Based on her profile, I can see she's interested in cultural experiences and fine dining.

Here's a suggested itinerary:

**Day 1 (March 15) - Arrival & Shinjuku**
- Arrive at Narita Airport (Flight UA234 - 2:30 PM)
- Transfer to Park Hyatt Tokyo (confirmed)
- Evening: Shinjuku Golden Gai exploration
- Dinner at Narisawa (reservation needed)

**Day 2 - Traditional Tokyo**
- Morning: Senso-ji Temple in Asakusa
- Afternoon: Tokyo National Museum
- Evening: Kaiseki dinner in Ginza

**Day 3 - Modern Tokyo**
- teamLab Borderless digital art museum
- Shopping in Harajuku & Omotesando
- Shibuya crossing experience

Would you like me to continue with the remaining days?`,
      timestamp: '2:32 PM'
    },
    {
      id: 4,
      role: 'user',
      content: 'Yes, please continue. Also add some restaurant recommendations.',
      timestamp: '2:33 PM'
    },
    {
      id: 5,
      role: 'assistant',
      content: `**Day 4 - Day Trip to Nikko**
- UNESCO World Heritage sites
- Toshogu Shrine
- Lake Chuzenji

**Day 5 - Culinary Tour**
- Tsukiji Outer Market tour (morning)
- Sushi-making class
- Dinner: Sukiyabashi Jiro (3 Michelin stars - reservation confirmed)

**Day 6 - Cultural Immersion**
- Tea ceremony in traditional machiya
- Kimono experience
- Imperial Palace East Gardens
- Dinner: Kanda (3 Michelin stars)

**Day 7 - Departure Day**
- Morning: Last-minute shopping in Ginza
- Checkout by 12:00 PM
- Transfer to Narita Airport

**Restaurant Recommendations:**
- Narisawa (2 Michelin stars - Modern Japanese)
- Sukiyabashi Jiro (3 Michelin stars - Sushi)
- Kanda (3 Michelin stars - Kaiseki)
- Tonki (Famous tonkatsu)
- Afuri (Yuzu ramen)

Should I create booking tasks for the restaurants?`,
      timestamp: '2:35 PM'
    }
  ]

  const handleSend = () => {
    if (message.trim()) {
      // Handle sending message
      setMessage('')
    }
  }

  return (
    <div className="h-screen flex flex-col">
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
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {conversations.map((msg) => (
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
                </div>
                <div className="text-xs text-tertiary mt-1">{msg.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
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
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask WeaverAssistant anything..."
                className="input-field flex-1"
              />
              <button
                onClick={handleSend}
                className="btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2"
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
  )
}

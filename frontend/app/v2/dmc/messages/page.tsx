'use client'

import { Search, Mail, User, Clock } from 'lucide-react'
import { useState } from 'react'

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState('1')

  const threads = [
    {
      id: '1',
      travelerName: 'Sarah Chen',
      subject: 'Tokyo Trip - March 15-22',
      lastMessage: 'Thank you for the updated itinerary! Everything looks perfect.',
      timestamp: '10 min ago',
      unread: true,
      bookingCode: 'BK-2025-XJ8K9P'
    },
    {
      id: '2',
      travelerName: 'Michael Brown',
      subject: 'Paris Hotel Upgrade',
      lastMessage: 'I would like to upgrade to a suite if possible.',
      timestamp: '2 hours ago',
      unread: true,
      bookingCode: 'BK-2025-L9M2N4'
    },
    {
      id: '3',
      travelerName: 'Emily Davis',
      subject: 'Bali Travel Documents',
      lastMessage: 'Passport copy attached as requested.',
      timestamp: 'Yesterday',
      unread: false,
      bookingCode: 'BK-2025-P7Q8R9'
    },
    {
      id: '4',
      travelerName: 'Robert Kim',
      subject: 'London Restaurant Reservations',
      lastMessage: 'Perfect! Looking forward to dining at The Ledbury.',
      timestamp: '2 days ago',
      unread: false,
      bookingCode: 'BK-2025-M3N4P5'
    },
    {
      id: '5',
      travelerName: 'Jessica Wilson',
      subject: 'Dubai Activities',
      lastMessage: 'Can we add a desert safari to the itinerary?',
      timestamp: '3 days ago',
      unread: false,
      bookingCode: 'BK-2025-Q6R7S8'
    }
  ]

  const messages = [
    {
      id: 1,
      sender: 'traveler',
      content: 'Hi! I just received the itinerary for my Tokyo trip. It looks amazing!',
      timestamp: '2:15 PM'
    },
    {
      id: 2,
      sender: 'dmc',
      content: 'I\'m so glad you like it! We\'ve curated this based on your preferences for cultural experiences and fine dining.',
      timestamp: '2:20 PM'
    },
    {
      id: 3,
      sender: 'traveler',
      content: 'I noticed the reservation at Sukiyabashi Jiro. That\'s incredible! How did you manage to get that?',
      timestamp: '2:22 PM'
    },
    {
      id: 4,
      sender: 'dmc',
      content: 'We have a special relationship with many top restaurants in Tokyo. Your reservation is confirmed for Day 5 at 7:00 PM. They require 48-hour cancellation notice.',
      timestamp: '2:25 PM'
    },
    {
      id: 5,
      sender: 'traveler',
      content: 'Perfect! One question - is the tea ceremony suitable for beginners? I\'ve never done one before.',
      timestamp: '2:28 PM'
    },
    {
      id: 6,
      sender: 'dmc',
      content: 'Absolutely! The tea ceremony we\'ve arranged is specifically designed for international visitors. The tea master speaks excellent English and will guide you through each step. It\'s a wonderful cultural experience.',
      timestamp: '2:30 PM'
    },
    {
      id: 7,
      sender: 'traveler',
      content: 'Thank you for the updated itinerary! Everything looks perfect.',
      timestamp: '2:35 PM'
    }
  ]

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <h1 className="text-3xl mb-1">Messages</h1>
          <p className="text-secondary">Communicate with travelers and team members</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread List */}
        <div className="w-96 border-r border-default bg-white overflow-y-auto">
          <div className="p-4 border-b border-default">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
              <input
                type="text"
                placeholder="Search messages..."
                className="input-field w-full pl-9 py-2 text-sm"
              />
            </div>
          </div>

          <div className="divide-y divide-border">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedThread === thread.id
                    ? 'bg-subtle'
                    : 'hover:bg-subtle'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-xs font-medium">
                      {thread.travelerName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{thread.travelerName}</div>
                      <div className="text-xs text-tertiary font-mono">{thread.bookingCode}</div>
                    </div>
                  </div>
                  {thread.unread && (
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                  )}
                </div>
                <div className="text-sm font-medium mb-1">{thread.subject}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-secondary truncate flex-1">
                    {thread.lastMessage}
                  </div>
                  <div className="text-xs text-tertiary ml-2 whitespace-nowrap">
                    {thread.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Thread Header */}
          <div className="border-b border-default px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center text-sm font-medium">
                SC
              </div>
              <div>
                <div className="font-medium">Sarah Chen</div>
                <div className="text-sm text-secondary">Tokyo Trip - March 15-22</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'dmc' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      msg.sender === 'dmc' ? 'bg-black text-white' : 'bg-subtle'
                    }`}
                  >
                    {msg.sender === 'dmc' ? 'DM' : <User size={14} />}
                  </div>
                  <div className={`flex-1 ${msg.sender === 'dmc' ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={`card p-3 max-w-lg ${
                        msg.sender === 'dmc' ? 'bg-subtle' : ''
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                    </div>
                    <div className="text-xs text-tertiary mt-1">{msg.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-default px-8 py-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                className="input-field flex-1"
              />
              <button className="btn-primary px-6 py-2.5 rounded-lg">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

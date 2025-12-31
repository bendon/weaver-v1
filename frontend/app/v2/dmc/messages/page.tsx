'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState('1')

  const threads = [
    {
      id: '1',
      travelerName: 'John Smith',
      bookingCode: 'ABC123',
      status: 'In-trip at Masai Mara',
      lastMessage: 'Saw lions this morning!',
      timestamp: '10:23',
      unread: false
    },
    {
      id: '2',
      travelerName: 'Jane Chen',
      bookingCode: 'GHI789',
      status: null,
      lastMessage: 'What should I pack?',
      timestamp: '09:45',
      unread: true
    },
    {
      id: '3',
      travelerName: 'Michael Johnson',
      bookingCode: 'DEF456',
      status: null,
      lastMessage: 'Thanks for the info!',
      timestamp: 'Yesterday',
      unread: false
    }
  ]

  const messages = [
    {
      id: 1,
      sender: 'dmc',
      content: 'Good morning! Today\'s schedule: game drive at 06:00, rest time, afternoon drive at 15:30. Everything going well?',
      timestamp: '06:15',
      read: true
    },
    {
      id: 2,
      sender: 'traveler',
      content: 'All great! Saw lions this morning! 🦁',
      timestamp: '06:45'
    },
    {
      id: 3,
      sender: 'dmc',
      content: 'Wonderful! Enjoy the afternoon drive. The Mara River crossing is happening nearby if you\'re lucky.',
      timestamp: '06:46',
      read: true,
      aiGenerated: true
    }
  ]

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="h-screen flex bg-subtle">
      {/* Conversation List */}
      <div className="w-80 border-r border-default bg-white flex flex-col">
        <div className="p-4 border-b border-default">
          <input type="text" placeholder="Search messages..." className="input-field w-full" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((thread) => (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className={`p-4 ${selectedThread === thread.id ? 'bg-subtle border-l-2 border-l-black' : 'border-b border-default'} cursor-pointer hover:bg-subtle`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  selectedThread === thread.id ? 'bg-black text-white' : 'bg-subtle'
                }`}>
                  {getInitials(thread.travelerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{thread.travelerName}</span>
                    <span className="text-xs text-tertiary">{thread.timestamp}</span>
                  </div>
                  <p className="text-sm text-secondary truncate">{thread.lastMessage}</p>
                  {thread.unread && (
                    <span className="badge badge-alert text-[10px] mt-1">Needs Reply</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="px-6 py-4 border-b border-default flex items-center gap-3">
          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-medium">
            {getInitials(threads.find(t => t.id === selectedThread)?.travelerName || '')}
          </div>
          <div>
            <h3 className="font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>
              {threads.find(t => t.id === selectedThread)?.travelerName}
            </h3>
            <p className="text-sm text-secondary">
              {threads.find(t => t.id === selectedThread)?.bookingCode} · {threads.find(t => t.id === selectedThread)?.status || 'Active booking'}
            </p>
          </div>
          <span className="ml-auto badge badge-active">WhatsApp</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-subtle">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'dmc' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2.5 max-w-sm ${
                msg.sender === 'dmc' ? 'message-out' : 'message-in'
              }`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender === 'dmc' ? 'opacity-70 text-right flex items-center justify-end gap-1' : 'text-tertiary'}`}>
                  {msg.aiGenerated && (
                    <span className="px-1 py-0.5 bg-white/20 rounded text-[10px]">AI</span>
                  )}
                  {msg.sender === 'dmc' && msg.read && '✓✓ '}
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-default bg-white flex gap-3">
          <input type="text" placeholder="Type a message..." className="input-field flex-1" />
          <button className="btn-primary px-5 py-2.5 rounded-lg">Send</button>
        </div>
      </div>
    </div>
  )
}

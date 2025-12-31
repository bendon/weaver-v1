'use client'

import { Zap, Clock, Mail, MessageSquare, Bell } from 'lucide-react'

export default function AutomationPage() {
  const automations = [
    {
      icon: Mail,
      title: 'Booking Confirmation Emails',
      description: 'Automatically send booking confirmations to travelers',
      enabled: true
    },
    {
      icon: Bell,
      title: 'Payment Reminders',
      description: 'Send payment reminders 7 days before due date',
      enabled: true
    },
    {
      icon: MessageSquare,
      title: 'Pre-Trip Messages',
      description: 'Send trip details and tips 3 days before departure',
      enabled: true
    },
    {
      icon: Clock,
      title: 'Flight Delay Notifications',
      description: 'Notify travelers and team about flight delays',
      enabled: true
    },
    {
      icon: Mail,
      title: 'Document Reminders',
      description: 'Remind travelers to upload missing documents',
      enabled: false
    },
    {
      icon: MessageSquare,
      title: 'Post-Trip Follow-up',
      description: 'Request feedback 2 days after trip completion',
      enabled: false
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Zap size={28} />
            <h1 className="text-3xl">Automation</h1>
          </div>
          <p className="text-secondary">Configure automated workflows and notifications</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Active Automations</h2>
            <p className="text-sm text-secondary">
              Enable or disable automated workflows to streamline your operations
            </p>
          </div>

          <div className="space-y-3">
            {automations.map((automation) => {
              const Icon = automation.icon
              return (
                <div key={automation.title} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-subtle flex items-center justify-center">
                        <Icon size={20} className="text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{automation.title}</h3>
                        <p className="text-sm text-secondary">{automation.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked={automation.enabled}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

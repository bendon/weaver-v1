'use client'

import { Building2, Users, Bell, Lock, CreditCard, Globe } from 'lucide-react'

export default function SettingsPage() {
  const sections = [
    {
      icon: Building2,
      title: 'Organization',
      description: 'Manage organization details and branding',
      action: 'Configure'
    },
    {
      icon: Users,
      title: 'Team & Permissions',
      description: 'Manage team members and access control',
      action: 'Manage'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure email and system notifications',
      action: 'Configure'
    },
    {
      icon: Lock,
      title: 'Security',
      description: 'Security settings and authentication',
      action: 'Configure'
    },
    {
      icon: CreditCard,
      title: 'Billing',
      description: 'Subscription and payment settings',
      action: 'Manage'
    },
    {
      icon: Globe,
      title: 'Integrations',
      description: 'Connect external services and APIs',
      action: 'Configure'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-default bg-white">
        <div className="px-8 py-6">
          <h1 className="text-3xl mb-1">Settings</h1>
          <p className="text-secondary">Manage your organization and account settings</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-4xl">
          <div className="grid gap-4">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <div
                  key={section.title}
                  className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-subtle flex items-center justify-center">
                        <Icon size={24} className="text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold mb-1">{section.title}</h3>
                        <p className="text-sm text-secondary">{section.description}</p>
                      </div>
                    </div>
                    <button className="btn-secondary px-4 py-2 rounded-lg text-sm">
                      {section.action}
                    </button>
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

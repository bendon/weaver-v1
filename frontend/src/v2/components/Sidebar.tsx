'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Mail,
  Plane,
  Zap,
  Settings,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  organizationName?: string
  userName?: string
  userRole?: string
}

export default function Sidebar({
  organizationName = 'Acme Travel DMC',
  userName = 'Sarah Johnson',
  userRole = 'DMC Manager'
}: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/v2/dmc/dashboard', icon: LayoutDashboard },
    { name: 'Bookings', href: '/v2/dmc/bookings', icon: Calendar },
    { name: 'Travelers', href: '/v2/dmc/travelers', icon: Users },
    { name: 'AI Assistant', href: '/v2/dmc/ai-assistant', icon: MessageSquare },
    { name: 'Messages', href: '/v2/dmc/messages', icon: Mail },
    { name: 'Flight Monitor', href: '/v2/dmc/flight-monitor', icon: Plane },
    { name: 'Automation', href: '/v2/dmc/automation', icon: Zap },
    { name: 'Settings', href: '/v2/dmc/settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <aside className="w-64 h-screen bg-white border-r border-default flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-default">
        <h1 className="text-xl font-semibold">TravelWeaver</h1>
      </div>

      {/* Organization */}
      <div className="px-6 py-4 border-b border-default">
        <div className="text-sm text-secondary">{organizationName}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                  isActive(item.href) ? 'active' : ''
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-default p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center text-sm font-medium">
            {userName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-xs text-secondary truncate">{userRole}</div>
          </div>
        </div>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-subtle rounded-md transition">
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

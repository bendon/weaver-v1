'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/v2/contexts/AuthContext'
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

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/v2/dmc/dashboard', icon: LayoutDashboard, badge: null },
    { name: 'Bookings', href: '/v2/dmc/bookings', icon: Calendar, badge: '23' },
    { name: 'Travelers', href: '/v2/dmc/travelers', icon: Users, badge: null },
    { name: 'AI Assistant', href: '/v2/dmc/ai-assistant', icon: MessageSquare, badge: null, hasDot: true },
    { name: 'Messages', href: '/v2/dmc/messages', icon: Mail, badge: '3' },
    { name: 'Flight Monitor', href: '/v2/dmc/flight-monitor', icon: Plane, badge: null },
  ]

  const bottomNavigation = [
    { name: 'Automation', href: '/v2/dmc/automation', icon: Zap },
    { name: 'Settings', href: '/v2/dmc/settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href

  // Get organization name (can be enhanced later with real org data)
  const organizationName = 'Safari Dreams Kenya'
  const organizationPlan = 'Professional Plan'

  // Get organization initials
  const orgInitials = organizationName
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Get user initials
  const userInitials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // Format user role
  const userRole = user?.role.replace('dmc_', '').replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'User'

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-default flex flex-col z-10">
      {/* Logo */}
      <div className="p-5 border-b border-default">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-semibold">T</span>
          </div>
          <span className="text-lg" style={{ fontFamily: "'EB Garamond', serif", fontWeight: 600 }}>
            TravelWeaver
          </span>
        </div>
      </div>

      {/* Organization */}
      <div className="p-4 border-b border-default">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-subtle rounded-full flex items-center justify-center text-sm font-medium">
            {orgInitials}
          </div>
          <div>
            <div className="text-sm font-medium">{organizationName}</div>
            <div className="text-xs text-tertiary">{organizationPlan}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                active ? 'active' : 'text-secondary'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-black text-white px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.hasDot && !active && (
                <span className="ml-auto w-2 h-2 bg-black rounded-full"></span>
              )}
            </Link>
          )
        })}

        <div className="pt-4 mt-4 border-t border-default">
          {bottomNavigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  active ? 'active' : 'text-secondary'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-default">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white text-sm font-medium">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.full_name || user?.email || 'User'}</div>
            <div className="text-xs text-tertiary truncate">{userRole}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-subtle transition-colors"
            title="Sign out"
          >
            <LogOut size={16} className="text-tertiary" />
          </button>
        </div>
      </div>
    </aside>
  )
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Plane,
  Settings,
  Zap,
  Menu,
  X,
  Building2,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './Sidebar.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    // DISABLED V1 AI Assistant - Use V2 WeaverAssistant at /v2/dmc/ai-assistant instead
    // { label: 'AI Assistant', href: '/', icon: Sparkles },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Bookings', href: '/bookings', icon: Calendar },
    { label: 'Travelers', href: '/travelers', icon: Users },
    { label: 'Messages', href: '/messages', icon: MessageSquare, badge: 0 }, // TODO: Get unread count
    { label: 'Flights', href: '/flights', icon: Plane },
    { label: 'Automation', href: '/automation', icon: Zap },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Building2 size={24} />
            <span className="sidebar-logo-text">TravelWeaver</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <button
                key={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNavigate(item.href)}
              >
                <Icon size={20} className="sidebar-nav-icon" />
                <span className="sidebar-nav-label">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="sidebar-nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


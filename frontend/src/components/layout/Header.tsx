'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './Header.css';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Generate title from pathname if not provided
  const pageTitle = title || (() => {
    const paths = pathname?.split('/').filter(Boolean) || [];
    if (paths.length === 0) return 'Dashboard';
    const lastPath = paths[paths.length - 1];
    return lastPath
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  })();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">{pageTitle}</h1>
        </div>

        <div className="header-right">
          {actions && <div className="header-actions">{actions}</div>}

          {/* Notifications */}
          <div className="header-notifications" ref={notificationsRef}>
            <button
              className="header-icon-button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {/* TODO: Add unread count badge */}
            </button>
            {notificationsOpen && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h3>Notifications</h3>
                </div>
                <div className="notifications-list">
                  {/* TODO: Render notifications */}
                  <div className="notification-empty">No new notifications</div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="header-user-menu" ref={userMenuRef}>
            <button
              className="header-user-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
            >
              <div className="header-user-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown size={16} className={userMenuOpen ? 'rotate' : ''} />
            </button>
            {userMenuOpen && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="user-menu-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="user-menu-info">
                    <div className="user-menu-name">{user?.name || 'User'}</div>
                    <div className="user-menu-email">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="user-menu-divider" />
                <button
                  className="user-menu-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/settings');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>
                <button
                  className="user-menu-item"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push('/settings');
                  }}
                >
                  <User size={16} />
                  <span>Profile</span>
                </button>
                <div className="user-menu-divider" />
                <button className="user-menu-item danger" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


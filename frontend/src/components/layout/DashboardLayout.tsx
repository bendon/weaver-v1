'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function DashboardLayout({ 
  children, 
  title, 
  breadcrumbs, 
  actions 
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Header title={title} breadcrumbs={breadcrumbs} actions={actions} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}


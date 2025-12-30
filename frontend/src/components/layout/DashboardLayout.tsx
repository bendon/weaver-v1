'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BreadcrumbBar } from './BreadcrumbBar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  backButton?: {
    label?: string;
    href?: string;
    onClick?: () => void;
  };
}

export function DashboardLayout({ 
  children, 
  title, 
  breadcrumbs, 
  actions,
  backButton
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Header title={title} actions={actions} />
        <BreadcrumbBar breadcrumbs={breadcrumbs} backButton={backButton} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}


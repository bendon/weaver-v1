import React from 'react';
import './StatCard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend }) => (
  <div className="stat-card">
    <div className="stat-card-content">
      <div className="stat-card-body">
        <div className="stat-card-main">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
          <div className="stat-card-trend">
            {trend ? (
              <>
                <div className={`stat-card-trend-badge ${trend.isPositive ? 'positive' : 'negative'}`}>
                  <span className="stat-card-trend-arrow">{trend.isPositive ? '↑' : '↓'}</span>
                  {Math.abs(trend.value)}%
                </div>
                <span className="stat-card-trend-label">vs last month</span>
              </>
            ) : (
              <div className="stat-card-trend-empty">spacer</div>
            )}
          </div>
        </div>
        {Icon && (
          <div className="stat-card-icon-wrapper">
            <Icon className="stat-card-icon" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
    <div className="stat-card-accent" />
  </div>
);


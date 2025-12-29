import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variants = {
    default: 'bg-black text-white',
    success: 'bg-green-50 text-green-700 border border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    destructive: 'bg-red-50 text-red-700 border border-red-200',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
    outline: 'border border-gray-300 text-gray-700 bg-white',
  };
  
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
};


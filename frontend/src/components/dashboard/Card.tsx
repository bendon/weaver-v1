import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => (
  <div className={cn('rounded-xl bg-white shadow-sm border border-gray-100', hover && 'hover:shadow-md transition-shadow', className)}>
    {children}
  </div>
);


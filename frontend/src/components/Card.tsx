import { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({ children, className = '', onClick, variant = 'default' }: CardProps) {
  return (
    <div
      className={`card card-${variant} ${className} ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}


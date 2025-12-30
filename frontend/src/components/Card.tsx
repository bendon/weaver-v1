import { ReactNode, CSSProperties } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: CSSProperties;
}

export default function Card({ children, className = '', onClick, variant = 'default', style }: CardProps) {
  return (
    <div
      className={`card card-${variant} ${className} ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}


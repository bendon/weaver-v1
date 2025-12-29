import React from 'react';
import { cn } from '../../utils/cn';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'primary' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  children, 
  className,
  active,
  ...props 
}) => {
  const variantClass = variant === 'primary' 
    ? 'button-primary' 
    : variant === 'secondary'
    ? 'button-secondary'
    : `button-${variant}`;
  
  const sizeClass = size === 'default'
    ? 'button-default-size'
    : `button-${size}`;
  
  return (
    <button 
      className={cn(
        'button',
        variantClass,
        sizeClass,
        active && 'active',
        className
      )} 
      {...props}
    >
      {children}
    </button>
  );
};


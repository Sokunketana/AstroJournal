import React from 'react';
import type { ButtonProps } from './Button.types';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon: Icon,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'px-4 py-3 text-sm font-bold uppercase tracking-wide text-white bg-purple-600 hover:bg-purple-500 rounded-xl',
    secondary: 'px-4 py-3 text-sm font-bold uppercase tracking-wide text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl',
    danger: 'px-4 py-2 text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-xl text-xs font-bold uppercase',
    success: 'px-4 py-2 text-green-400/80 hover:text-green-400 hover:bg-green-400/10 rounded-xl text-xs font-bold uppercase',
    ghost: 'px-4 py-2 text-gray-400/50 hover:text-gray-400 hover:bg-white/5 rounded-xl text-xs font-bold uppercase',
    icon: 'p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {Icon && <Icon size={variant === 'icon' ? 20 : 14} />}
      {children}
    </button>
  );
};

export default Button;

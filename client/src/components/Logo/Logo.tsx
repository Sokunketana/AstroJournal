import React from 'react';
import type { LogoProps } from './Logo.types';

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <h1 className={`font-black tracking-tighter text-white select-none ${className}`}>
      ASTROJOURNAL
    </h1>
  );
};

export default Logo;

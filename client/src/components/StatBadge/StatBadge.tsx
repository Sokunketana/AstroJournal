import React from 'react';
import type { StatBadgeProps } from './StatBadge.types';

const StatBadge: React.FC<StatBadgeProps> = ({
  icon: Icon,
  value,
  colorClass,
  showBorder = true,
  tooltip,
}) => {
  return (
    <div 
      className={`flex items-center gap-1.5 ${showBorder ? 'border-r border-white/10 pr-3' : ''}`}
      title={tooltip}
    >
      <Icon size={16} className={colorClass} />
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
};

export default StatBadge;

import type { LucideIcon } from 'lucide-react';

export interface StatBadgeProps {
  icon: LucideIcon;
  value: string | number;
  colorClass: string;
  showBorder?: boolean;
}

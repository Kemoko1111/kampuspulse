'use client';

import { cn } from '@/lib/utils';

export type StatusVariant = 'order' | 'payment' | 'user' | 'rider';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

type StatusColor = {
  bg: string;
  text: string;
  dot: string;
};

const statusColorMap: Record<string, StatusColor> = {
  // Green statuses
  active: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  success: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  delivered: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  verified: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  online: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },

  // Yellow statuses
  pending: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  awaiting: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  review: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },

  // Blue statuses
  preparing: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  processing: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  'in-transit': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  in_transit: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  shipped: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },

  // Red statuses
  cancelled: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  failed: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  banned: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  offline: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },

  // Orange statuses
  suspended: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  inactive: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  paused: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
};

const defaultColor: StatusColor = {
  bg: 'bg-gray-500/15',
  text: 'text-gray-400',
  dot: 'bg-gray-400',
};

function getStatusColor(status: string): StatusColor {
  const normalised = status.toLowerCase().replace(/\s+/g, '-');
  return statusColorMap[normalised] || defaultColor;
}

function formatStatusLabel(status: string): string {
  return status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = getStatusColor(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        colors.bg,
        colors.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', colors.dot)} />
      {formatStatusLabel(status)}
    </span>
  );
}

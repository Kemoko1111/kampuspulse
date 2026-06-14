'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'yellow';
  index?: number;
}

const colorMap = {
  blue: {
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    trendPositive: 'bg-blue-500/10 text-blue-400',
    ring: 'ring-blue-500/20',
  },
  green: {
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  orange: {
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    trendPositive: 'bg-orange-500/10 text-orange-400',
    ring: 'ring-orange-500/20',
  },
  red: {
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    trendPositive: 'bg-red-500/10 text-red-400',
    ring: 'ring-red-500/20',
  },
  purple: {
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    trendPositive: 'bg-purple-500/10 text-purple-400',
    ring: 'ring-purple-500/20',
  },
  yellow: {
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-400',
    trendPositive: 'bg-yellow-500/10 text-yellow-400',
    ring: 'ring-yellow-500/20',
  },
};

export function StatCard({ title, value, icon: Icon, trend, color, index = 0 }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.21, 1.11, 0.81, 0.99],
      }}
      className="glass-card p-6 group hover:ring-1 hover:ring-white/10 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 rounded-xl transition-transform duration-300 group-hover:scale-110',
            colors.iconBg
          )}
        >
          <Icon className={cn('w-6 h-6', colors.iconColor)} />
        </div>

        {/* Trend Badge */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
              trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="font-display font-black text-3xl text-foreground tracking-tight">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>
    </motion.div>
  );
}

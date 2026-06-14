'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterBarSearch {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}

export interface FilterBarProps {
  search?: FilterBarSearch;
  filters?: FilterBarFilter[];
  actions?: ReactNode;
}

export function FilterBar({ search, filters, actions }: FilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass-card p-3 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        {search && (
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || 'Search...'}
              className="input-premium pl-10 py-2.5 text-sm"
            />
          </div>
        )}

        {/* Filters */}
        {filters && filters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((filter) => (
              <div key={filter.key} className="relative">
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className={cn(
                    'appearance-none bg-background/50 backdrop-blur border border-border/50 rounded-xl',
                    'pl-3 pr-8 py-2.5 text-sm text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
                    'transition-all duration-200 cursor-pointer',
                    filter.value === '' && 'text-muted-foreground'
                  )}
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Spacer + Actions */}
        {actions && (
          <div className="flex items-center gap-2 md:ml-auto flex-shrink-0">{actions}</div>
        )}
      </div>
    </motion.div>
  );
}

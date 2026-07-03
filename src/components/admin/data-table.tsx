'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PackageOpen,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
}

export interface DataTableAction<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (row: T) => void;
  variant?: 'default' | 'danger';
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
  pagination?: DataTablePagination;
  onRowClick?: (row: T) => void;
  actions?: DataTableAction<T>[];
}

type SortDirection = 'asc' | 'desc' | null;

function getNestedValue(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
    obj
  );
}

function SkeletonRow({ columns, hasActions }: { columns: number; hasActions: boolean }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns + (hasActions ? 1 : 0) }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="skeleton h-4 rounded-md" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon: EmptyIcon = PackageOpen,
  pagination,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [openActionRow, setOpenActionRow] = useState<number | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;
    const aVal = getNestedValue(a, sortKey);
    const bVal = getNestedValue(b, sortKey);
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    const cmp =
      typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : Number(aVal) - Number(bVal);
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                    col.sortable !== false && 'cursor-pointer select-none hover:text-foreground transition-colors'
                  )}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <span className="text-muted-foreground/50">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {/* Loading State */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} columns={columns.length} hasActions={!!actions?.length} />
              ))}

            {/* Empty State */}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (actions?.length ? 1 : 0)} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                      <EmptyIcon className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground font-medium">{emptyMessage}</p>
                    <p className="text-muted-foreground/50 text-sm mt-1">
                      Try adjusting your filters or search query
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!loading &&
              sortedData.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: rowIndex * 0.03 }}
                  className={cn(
                    'border-b border-white/5 transition-colors duration-150',
                    onRowClick
                      ? 'cursor-pointer hover:bg-white/[0.04]'
                      : 'hover:bg-white/[0.02]'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-sm text-foreground">
                      {col.render
                        ? col.render(getNestedValue(row, col.key), row)
                        : String(getNestedValue(row, col.key) ?? '—')}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="px-4 py-3.5 text-right relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionRow(openActionRow === rowIndex ? null : rowIndex);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {openActionRow === rowIndex && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionRow(null);
                              }}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-4 top-full mt-1 z-20 min-w-[160px] glass-card p-1.5 shadow-lg"
                            >
                              {actions.map((action, actionIndex) => {
                                const ActionIcon = action.icon;
                                return (
                                  <button
                                    key={actionIndex}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(row);
                                      setOpenActionRow(null);
                                    }}
                                    className={cn(
                                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                      action.variant === 'danger'
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-foreground hover:bg-white/10'
                                    )}
                                  >
                                    {ActionIcon && <ActionIcon className="w-4 h-4" />}
                                    {action.label}
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </td>
                  )}
                </motion.tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
          <p className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{pagination.page}</span> of{' '}
            <span className="font-semibold text-foreground">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

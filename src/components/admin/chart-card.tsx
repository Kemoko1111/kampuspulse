'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartCardProps {
  title: string;
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

export function ChartCard({
  title,
  data,
  color = '#3b82f6',
  height = 240,
}: ChartCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { maxValue, chartPadding, barWidth, barGap, chartWidth } = useMemo(() => {
    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const padding = { top: 24, right: 16, bottom: 40, left: 48 };
    const availableWidth = 600 - padding.left - padding.right;
    const gap = Math.max(4, Math.min(12, availableWidth / data.length / 4));
    const bWidth = Math.max(8, (availableWidth - gap * (data.length - 1)) / data.length);
    return {
      maxValue: maxVal,
      chartPadding: padding,
      barWidth: bWidth,
      barGap: gap,
      chartWidth: 600,
    };
  }, [data]);

  const chartHeight = height;
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

  // Y-axis grid lines
  const gridLines = useMemo(() => {
    const lines: number[] = [];
    const step = Math.ceil(maxValue / 4);
    for (let i = 0; i <= 4; i++) {
      lines.push(step * i);
    }
    return lines;
  }, [maxValue]);

  function formatValue(val: number): string {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-bold text-base text-foreground">{title}</h3>
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{formatValue(data[hoveredIndex].value)}</span>
            {' · '}
            {data[hoveredIndex].label}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ height: `${height}px` }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines and Y-axis labels */}
          {gridLines.map((val, i) => {
            const y = chartPadding.top + innerHeight - (val / maxValue) * innerHeight;
            return (
              <g key={i}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={chartWidth - chartPadding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.07}
                  strokeDasharray={i === 0 ? 'none' : '4 4'}
                />
                <text
                  x={chartPadding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="currentColor"
                  fillOpacity={0.35}
                  fontSize={10}
                  fontFamily="var(--font-inter), Inter, sans-serif"
                >
                  {formatValue(val)}
                </text>
              </g>
            );
          })}

          {/* Max reference line */}
          <line
            x1={chartPadding.left}
            y1={chartPadding.top}
            x2={chartWidth - chartPadding.right}
            y2={chartPadding.top}
            stroke={color}
            strokeOpacity={0.3}
            strokeDasharray="6 4"
            strokeWidth={1}
          />

          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * innerHeight;
            const x = chartPadding.left + i * (barWidth + barGap);
            const y = chartPadding.top + innerHeight - barHeight;
            const isHovered = hoveredIndex === i;
            const radius = Math.min(4, barWidth / 3);

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Hover background */}
                <rect
                  x={x - 4}
                  y={chartPadding.top}
                  width={barWidth + 8}
                  height={innerHeight}
                  fill={color}
                  fillOpacity={isHovered ? 0.05 : 0}
                  rx={4}
                />

                {/* Bar */}
                <motion.rect
                  x={x}
                  width={barWidth}
                  rx={radius}
                  ry={radius}
                  fill={color}
                  fillOpacity={isHovered ? 1 : 0.7}
                  initial={{ y: chartPadding.top + innerHeight, height: 0 }}
                  animate={{ y, height: barHeight }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.05,
                    ease: [0.21, 1.11, 0.81, 0.99],
                  }}
                />

                {/* Hover value tooltip */}
                {isHovered && (
                  <motion.g
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <rect
                      x={x + barWidth / 2 - 28}
                      y={y - 28}
                      width={56}
                      height={22}
                      rx={6}
                      fill="hsl(var(--card))"
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 14}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize={11}
                      fontWeight={600}
                      fontFamily="var(--font-inter), Inter, sans-serif"
                    >
                      {formatValue(d.value)}
                    </text>
                  </motion.g>
                )}

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={chartPadding.top + innerHeight + 16}
                  textAnchor="middle"
                  fill="currentColor"
                  fillOpacity={isHovered ? 0.8 : 0.35}
                  fontSize={10}
                  fontFamily="var(--font-inter), Inter, sans-serif"
                >
                  {d.label.length > 6 ? d.label.slice(0, 5) + '…' : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}

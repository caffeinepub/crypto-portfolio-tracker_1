import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CryptoHolding, StakingReward } from '../backend';
import { CryptoPrices } from '../hooks/useCryptoPrices';

interface HoldingWithLiveValue extends CryptoHolding {
  currentValueGBP: number;
}

interface StakingWithLiveValue extends StakingReward {
  currentValueGBP: number;
}

interface PortfolioCompositionChartProps {
  holdings: HoldingWithLiveValue[];
  stakingRewards: StakingWithLiveValue[];
  prices?: CryptoPrices;
}

const CHART_COLORS = [
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#ef4444', // red
  '#84cc16', // lime
  '#a855f7', // purple
];

function formatGBP(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
        color: 'var(--foreground)',
      }}
    >
      <div className="font-semibold">{item.name}</div>
      <div>{formatGBP(item.value)}</div>
      <div className="text-muted-foreground">{(item.payload.percent * 100).toFixed(1)}%</div>
    </div>
  );
}

export default function PortfolioCompositionChart({
  holdings,
  stakingRewards,
}: PortfolioCompositionChartProps) {
  // Aggregate by symbol (holdings + staking rewards already have live values applied)
  const symbolMap: Record<string, number> = {};

  for (const h of holdings) {
    const sym = h.symbol.toUpperCase();
    const val = isFinite(h.currentValueGBP) ? h.currentValueGBP : 0;
    symbolMap[sym] = (symbolMap[sym] ?? 0) + val;
  }

  for (const r of stakingRewards) {
    const sym = r.symbol.toUpperCase();
    const val = isFinite(r.currentValueGBP) ? r.currentValueGBP : 0;
    symbolMap[sym] = (symbolMap[sym] ?? 0) + val;
  }

  const chartData = Object.entries(symbolMap)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No holdings data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: '11px', color: 'var(--foreground)' }}>{value}</span>
          )}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

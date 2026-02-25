import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PortfolioChartProps {
  totalInvestedGBP: number;
  currentValueGBP: number;
  timeRange: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

function getTimeRangeDays(timeRange: string): number {
  switch (timeRange) {
    case '1W': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case '6M': return 180;
    case '1Y': return 365;
    case 'ALL': return 730;
    default: return 30;
  }
}

function formatGBP(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '£0';
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(1)}k`;
  }
  return `£${value.toFixed(0)}`;
}

export default function PortfolioChart({ totalInvestedGBP, currentValueGBP, timeRange }: PortfolioChartProps) {
  const data = useMemo<ChartDataPoint[]>(() => {
    const days = getTimeRangeDays(timeRange);
    const points = Math.min(days, 60);
    const now = Date.now();
    const startMs = now - days * 24 * 60 * 60 * 1000;

    const invested = isFinite(totalInvestedGBP) && totalInvestedGBP > 0 ? totalInvestedGBP : 0;
    const current = isFinite(currentValueGBP) && currentValueGBP > 0 ? currentValueGBP : invested;

    const result: ChartDataPoint[] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const ts = startMs + t * (now - startMs);
      const date = new Date(ts);

      // Interpolate with slight curve (quadratic ease-in)
      const easedT = t * t * (3 - 2 * t); // smoothstep
      const value = invested + easedT * (current - invested);

      const label = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        ...(days > 180 ? { year: '2-digit' } : {}),
      });

      result.push({ date: label, value: Math.max(0, value) });
    }
    return result;
  }, [totalInvestedGBP, currentValueGBP, timeRange]);

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const padding = (maxVal - minVal) * 0.1 || 100;

  const isPositive = currentValueGBP >= totalInvestedGBP;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatGBP}
          domain={[Math.max(0, minVal - padding), maxVal + padding]}
          width={55}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--foreground)',
          }}
          formatter={(value: number) => [
            new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value),
            'Portfolio Value',
          ]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={isPositive ? 'var(--success)' : 'var(--destructive)'}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: isPositive ? 'var(--success)' : 'var(--destructive)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

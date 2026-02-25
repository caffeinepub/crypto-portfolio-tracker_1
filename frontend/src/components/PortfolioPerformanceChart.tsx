import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PortfolioPerformanceChartProps {
  totalInvestedGBP: number;
  currentValueGBP: number;
  timeRange?: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  invested: number;
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

export default function PortfolioPerformanceChart({
  totalInvestedGBP,
  currentValueGBP,
  timeRange = '1M',
}: PortfolioPerformanceChartProps) {
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

      // Smoothstep interpolation
      const easedT = t * t * (3 - 2 * t);
      const value = invested + easedT * (current - invested);

      const label = date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        ...(days > 180 ? { year: '2-digit' } : {}),
      });

      result.push({
        date: label,
        value: Math.max(0, value),
        invested: invested,
      });
    }
    return result;
  }, [totalInvestedGBP, currentValueGBP, timeRange]);

  const minVal = Math.min(...data.map(d => Math.min(d.value, d.invested)));
  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.invested)));
  const padding = (maxVal - minVal) * 0.1 || 100;

  const isPositive = currentValueGBP >= totalInvestedGBP;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isPositive ? 'var(--success)' : 'var(--destructive)'}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isPositive ? 'var(--success)' : 'var(--destructive)'}
              stopOpacity={0.02}
            />
          </linearGradient>
          <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
          formatter={(value: number, name: string) => [
            new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value),
            name === 'value' ? 'Portfolio Value' : 'Invested',
          ]}
        />
        <Area
          type="monotone"
          dataKey="invested"
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#investedGradient)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={isPositive ? 'var(--success)' : 'var(--destructive)'}
          strokeWidth={2}
          fill="url(#portfolioGradient)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

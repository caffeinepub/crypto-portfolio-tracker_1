import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGetPortfolioHistory } from '../hooks/useQueries';
import { PortfolioHistoryRecord } from '../backend';

type HistoryTimeRange = '1D' | '1W' | '1M' | '6M' | '1Y' | 'ALL';

const HISTORY_RANGES: HistoryTimeRange[] = ['1D', '1W', '1M', '6M', '1Y', 'ALL'];

function getTimestampsForRange(range: HistoryTimeRange): { from: bigint; to: bigint } {
  const nowMs = Date.now();
  const nowNs = BigInt(nowMs) * 1_000_000n;
  let fromMs: number;
  switch (range) {
    case '1D': fromMs = nowMs - 1 * 24 * 60 * 60 * 1000; break;
    case '1W': fromMs = nowMs - 7 * 24 * 60 * 60 * 1000; break;
    case '1M': fromMs = nowMs - 30 * 24 * 60 * 60 * 1000; break;
    case '6M': fromMs = nowMs - 180 * 24 * 60 * 60 * 1000; break;
    case '1Y': fromMs = nowMs - 365 * 24 * 60 * 60 * 1000; break;
    case 'ALL': fromMs = 0; break;
    default: fromMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  }
  return { from: BigInt(fromMs) * 1_000_000n, to: nowNs };
}

function formatGBP(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '£0';
  if (value >= 1000) return `£${(value / 1000).toFixed(1)}k`;
  return `£${value.toFixed(0)}`;
}

function formatDate(timestampNs: bigint, range: HistoryTimeRange): string {
  const ms = Number(timestampNs / 1_000_000n);
  const date = new Date(ms);
  if (range === '1D') {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(range === '1Y' || range === 'ALL' ? { year: '2-digit' } : {}),
  });
}

interface ChartPoint {
  date: string;
  value: number;
}

export default function PortfolioValueHistoryChart() {
  const [selectedRange, setSelectedRange] = useState<HistoryTimeRange>('1M');
  const { from, to } = useMemo(() => getTimestampsForRange(selectedRange), [selectedRange]);

  const { data: records = [], isLoading } = useGetPortfolioHistory(from, to);

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!records.length) return [];
    const sorted = [...records].sort((a, b) =>
      Number(a.timestamp - b.timestamp)
    );
    return sorted.map((r: PortfolioHistoryRecord) => ({
      date: formatDate(r.timestamp, selectedRange),
      value: isFinite(r.totalValueGBP) ? r.totalValueGBP : 0,
    }));
  }, [records, selectedRange]);

  const minVal = chartData.length ? Math.min(...chartData.map(d => d.value)) : 0;
  const maxVal = chartData.length ? Math.max(...chartData.map(d => d.value)) : 100;
  const padding = (maxVal - minVal) * 0.1 || 50;

  return (
    <div className="space-y-3">
      {/* Time Range Selector */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">History:</span>
        {HISTORY_RANGES.map(range => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              selectedRange === range
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
          Loading history...
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-1">
          <span className="text-base">📈</span>
          <span>No history data yet for this range.</span>
          <span className="text-xs opacity-70">Data is recorded as you use the app.</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              stroke="var(--primary)"
              strokeWidth={2}
              dot={chartData.length <= 30 ? { r: 2, fill: 'var(--primary)' } : false}
              activeDot={{ r: 4, fill: 'var(--primary)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

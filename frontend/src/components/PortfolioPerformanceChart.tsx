import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CryptoHolding, StakingReward, TimeRange } from '../backend';
import { useTheme } from 'next-themes';

interface PortfolioPerformanceChartProps {
  holdings: CryptoHolding[];
  rewards: StakingReward[];
  timeRange: TimeRange;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  portfolioValue: number;
}

export default function PortfolioPerformanceChart({ holdings, rewards, timeRange }: PortfolioPerformanceChartProps) {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    if (holdings.length === 0) {
      return [];
    }

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    let startTime: number;
    let dataPoints: number;
    let intervalMs: number;

    switch (timeRange) {
      case TimeRange.hourlyLive:
      case TimeRange.day:
        startTime = now - msPerDay;
        dataPoints = 24;
        intervalMs = msPerDay / dataPoints;
        break;
      case TimeRange.week:
        startTime = now - 7 * msPerDay;
        dataPoints = 28;
        intervalMs = (7 * msPerDay) / dataPoints;
        break;
      case TimeRange.month:
        startTime = now - 30 * msPerDay;
        dataPoints = 30;
        intervalMs = msPerDay;
        break;
      case TimeRange.sixMonths:
        startTime = now - 180 * msPerDay;
        dataPoints = 30;
        intervalMs = (180 * msPerDay) / dataPoints;
        break;
      case TimeRange.year:
        startTime = now - 365 * msPerDay;
        dataPoints = 52;
        intervalMs = (365 * msPerDay) / dataPoints;
        break;
      case TimeRange.allTime:
      default: {
        let earliestTime = now - 365 * msPerDay;

        rewards.forEach(r => {
          const rewardTime = Number(r.rewardDate) / 1_000_000;
          if (rewardTime < earliestTime) {
            earliestTime = rewardTime;
          }
        });

        startTime = earliestTime;
        const totalDays = Math.ceil((now - startTime) / msPerDay);
        dataPoints = Math.min(Math.max(totalDays, 30), 365);
        intervalMs = (now - startTime) / dataPoints;
        break;
      }
    }

    const data: ChartDataPoint[] = [];

    for (let i = 0; i <= dataPoints; i++) {
      const timestamp = startTime + i * intervalMs;

      // Use stored currentValueGBP from holdings
      let portfolioValue = 0;
      holdings.forEach((holding) => {
        portfolioValue += holding.currentValueGBP;
      });

      let dateFormat: Intl.DateTimeFormatOptions;
      if (timeRange === TimeRange.hourlyLive || timeRange === TimeRange.day) {
        dateFormat = { hour: '2-digit', minute: '2-digit' };
      } else if (timeRange === TimeRange.week) {
        dateFormat = { weekday: 'short', hour: '2-digit' };
      } else if (timeRange === TimeRange.month) {
        dateFormat = { month: 'short', day: 'numeric' };
      } else {
        dateFormat = { month: 'short', day: 'numeric', year: '2-digit' };
      }

      data.push({
        date: new Date(timestamp).toLocaleDateString('en-GB', dateFormat),
        timestamp,
        portfolioValue,
      });
    }

    return data;
  }, [holdings, rewards, timeRange]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Add holdings to see your portfolio chart
      </div>
    );
  }

  const isDark = theme === 'dark';

  const isGaining = chartData.length >= 2 &&
    chartData[chartData.length - 1].portfolioValue >= chartData[0].portfolioValue;

  const values = chartData.map(d => d.portfolioValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || maxValue * 0.1 || 10;
  const yAxisDomain: [number, number] = [
    Math.max(0, minValue - padding),
    maxValue + padding
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={isGaining ? 'oklch(0.70 0.20 145)' : 'oklch(0.65 0.25 27)'}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={isGaining ? 'oklch(0.70 0.20 145)' : 'oklch(0.65 0.25 27)'}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke={isDark ? '#888' : '#666'}
          style={{ fontSize: '11px' }}
          angle={timeRange === TimeRange.day || timeRange === TimeRange.hourlyLive ? -45 : 0}
          textAnchor={timeRange === TimeRange.day || timeRange === TimeRange.hourlyLive ? 'end' : 'middle'}
          height={timeRange === TimeRange.day || timeRange === TimeRange.hourlyLive ? 60 : 30}
          tick={{ fill: isDark ? '#888' : '#666' }}
        />
        <YAxis
          stroke={isDark ? '#888' : '#666'}
          style={{ fontSize: '11px' }}
          domain={yAxisDomain}
          tickFormatter={(value) => `£${value.toLocaleString('en-GB', { notation: 'compact', maximumFractionDigits: 1 })}`}
          tick={{ fill: isDark ? '#888' : '#666' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? 'oklch(0.16 0 0)' : 'oklch(1 0 0)',
            border: `1px solid ${isDark ? 'oklch(0.24 0 0)' : 'oklch(0.90 0 0)'}`,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          labelStyle={{ color: isDark ? 'oklch(0.98 0 0)' : 'oklch(0.145 0 0)', fontWeight: 600 }}
          formatter={(value: number) => [
            `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            'Value'
          ]}
        />
        <Area
          type="monotone"
          dataKey="portfolioValue"
          stroke={isGaining ? 'oklch(0.70 0.20 145)' : 'oklch(0.65 0.25 27)'}
          strokeWidth={3}
          fill="url(#portfolioGradient)"
          dot={false}
          activeDot={{ r: 6, strokeWidth: 2 }}
          animationDuration={800}
          animationEasing="ease-in-out"
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

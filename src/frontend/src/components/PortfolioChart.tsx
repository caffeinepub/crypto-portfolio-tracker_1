import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CryptoHolding, StakingReward, TimeRange } from '../backend';
import { useTheme } from 'next-themes';

interface PortfolioChartProps {
  holdings: CryptoHolding[];
  rewards: StakingReward[];
  timeRange: TimeRange;
  prices: Record<string, number> | null;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

export default function PortfolioChart({ holdings, rewards, timeRange, prices }: PortfolioChartProps) {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    if (!prices || holdings.length === 0) {
      return [];
    }

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    let startTime: number;
    let dataPoints: number;
    
    switch (timeRange) {
      case TimeRange.day:
        startTime = now - msPerDay;
        dataPoints = 24;
        break;
      case TimeRange.week:
        startTime = now - 7 * msPerDay;
        dataPoints = 7;
        break;
      case TimeRange.month:
        startTime = now - 30 * msPerDay;
        dataPoints = 30;
        break;
      case TimeRange.sixMonths:
        startTime = now - 180 * msPerDay;
        dataPoints = 30;
        break;
      case TimeRange.year:
        startTime = now - 365 * msPerDay;
        dataPoints = 52;
        break;
      case TimeRange.allTime:
      default:
        // For all time, show data for the past year or 30 days minimum
        startTime = now - 365 * msPerDay;
        dataPoints = 52;
        break;
    }

    const interval = (now - startTime) / dataPoints;
    const data: ChartDataPoint[] = [];

    // Calculate current portfolio value
    let currentPortfolioValue = 0;
    holdings.forEach((holding) => {
      const price = prices[holding.symbol.toUpperCase()] || 0;
      currentPortfolioValue += holding.amount * price;
    });

    rewards.forEach((reward) => {
      const rewardTime = Number(reward.rewardDate) / 1_000_000;
      // Only include rewards that have been received
      if (rewardTime <= now) {
        const price = prices[reward.symbol.toUpperCase()] || 0;
        currentPortfolioValue += reward.amount * price;
      }
    });

    // Generate data points showing current value at each timestamp
    // Note: Without historical price data, we show the current value across all time points
    // This is a simplified view - in a real app, you'd fetch historical prices
    for (let i = 0; i <= dataPoints; i++) {
      const timestamp = startTime + i * interval;
      
      // Calculate portfolio value including only rewards received by this timestamp
      let portfolioValue = currentPortfolioValue;
      
      // Subtract rewards not yet received at this timestamp
      rewards.forEach((reward) => {
        const rewardTime = Number(reward.rewardDate) / 1_000_000;
        if (rewardTime > timestamp) {
          const price = prices[reward.symbol.toUpperCase()] || 0;
          portfolioValue -= reward.amount * price;
        }
      });

      data.push({
        date: new Date(timestamp).toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
          ...(timeRange === TimeRange.year || timeRange === TimeRange.allTime ? { year: '2-digit' } : {}),
        }),
        value: portfolioValue,
      });
    }

    return data;
  }, [holdings, rewards, timeRange, prices]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        Add holdings to see your portfolio chart
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#e5e7eb'} />
        <XAxis
          dataKey="date"
          stroke={isDark ? '#888' : '#666'}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke={isDark ? '#888' : '#666'}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `£${value.toLocaleString('en-GB')}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? '#1f2937' : '#fff',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
          }}
          labelStyle={{ color: isDark ? '#fff' : '#000' }}
          formatter={(value: number) => [`£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="oklch(var(--chart-1))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

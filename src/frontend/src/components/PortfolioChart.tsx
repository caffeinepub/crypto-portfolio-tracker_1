import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CryptoHolding, StakingReward, TimeRange } from '../backend';
import { useTheme } from 'next-themes';

interface PortfolioChartProps {
  holdings: CryptoHolding[];
  rewards: StakingReward[];
  timeRange: TimeRange;
  prices: Record<string, number>;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

export default function PortfolioChart({ holdings, rewards, timeRange, prices }: PortfolioChartProps) {
  const { theme } = useTheme();

  const chartData = useMemo(() => {
    if (!prices || Object.keys(prices).length === 0 || holdings.length === 0) {
      return [];
    }

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const msPerHour = 60 * 60 * 1000;
    
    let startTime: number;
    let dataPoints: number;
    let intervalMs: number;
    
    // Configure time range with proper data point distribution
    switch (timeRange) {
      case TimeRange.hourlyLive:
        startTime = now - msPerHour;
        dataPoints = 12; // 5-minute intervals for the past hour
        intervalMs = msPerHour / dataPoints;
        break;
      case TimeRange.day:
        startTime = now - msPerDay;
        dataPoints = 24; // Hourly data points
        intervalMs = msPerDay / dataPoints;
        break;
      case TimeRange.week:
        startTime = now - 7 * msPerDay;
        dataPoints = 28; // 4 points per day
        intervalMs = (7 * msPerDay) / dataPoints;
        break;
      case TimeRange.month:
        startTime = now - 30 * msPerDay;
        dataPoints = 30; // Daily data points
        intervalMs = msPerDay;
        break;
      case TimeRange.sixMonths:
        startTime = now - 180 * msPerDay;
        dataPoints = 30; // Weekly-ish data points
        intervalMs = (180 * msPerDay) / dataPoints;
        break;
      case TimeRange.year:
        startTime = now - 365 * msPerDay;
        dataPoints = 52; // Weekly data points
        intervalMs = (365 * msPerDay) / dataPoints;
        break;
      case TimeRange.allTime:
      default:
        // Find earliest holding or reward date
        let earliestTime = now - 365 * msPerDay; // Default to 1 year
        
        rewards.forEach(r => {
          const rewardTime = Number(r.rewardDate) / 1_000_000;
          if (rewardTime < earliestTime) {
            earliestTime = rewardTime;
          }
        });
        
        startTime = earliestTime;
        const totalDays = Math.ceil((now - startTime) / msPerDay);
        dataPoints = Math.min(Math.max(totalDays, 30), 365); // Between 30 and 365 points
        intervalMs = (now - startTime) / dataPoints;
        break;
    }

    const data: ChartDataPoint[] = [];

    // Calculate current portfolio value using live prices
    let currentPortfolioValue = 0;
    holdings.forEach((holding) => {
      const price = prices[holding.symbol.toUpperCase()] || 0;
      currentPortfolioValue += holding.amount * price;
    });

    // Add all rewards to current value
    rewards.forEach((reward) => {
      const price = prices[reward.symbol.toUpperCase()] || 0;
      currentPortfolioValue += reward.amount * price;
    });

    // Generate data points showing portfolio value at each timestamp
    for (let i = 0; i <= dataPoints; i++) {
      const timestamp = startTime + i * intervalMs;
      
      // Start with holdings value (using current prices)
      let portfolioValue = 0;
      holdings.forEach((holding) => {
        const price = prices[holding.symbol.toUpperCase()] || 0;
        portfolioValue += holding.amount * price;
      });
      
      // Add only rewards received by this timestamp
      rewards.forEach((reward) => {
        const rewardTime = Number(reward.rewardDate) / 1_000_000;
        if (rewardTime <= timestamp) {
          const price = prices[reward.symbol.toUpperCase()] || 0;
          portfolioValue += reward.amount * price;
        }
      });

      // Format date based on time range
      let dateFormat: Intl.DateTimeFormatOptions;
      if (timeRange === TimeRange.hourlyLive) {
        dateFormat = { hour: '2-digit', minute: '2-digit' };
      } else if (timeRange === TimeRange.day) {
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
          angle={timeRange === TimeRange.hourlyLive || timeRange === TimeRange.day ? -45 : 0}
          textAnchor={timeRange === TimeRange.hourlyLive || timeRange === TimeRange.day ? 'end' : 'middle'}
          height={timeRange === TimeRange.hourlyLive || timeRange === TimeRange.day ? 60 : 30}
        />
        <YAxis
          stroke={isDark ? '#888' : '#666'}
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `£${value.toLocaleString('en-GB', { notation: 'compact', maximumFractionDigits: 1 })}`}
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

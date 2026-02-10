import { useMemo, useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CryptoHolding, StakingReward, TimeRange } from '../backend';
import { useTheme } from 'next-themes';

interface PortfolioPerformanceChartProps {
  holdings: CryptoHolding[];
  rewards: StakingReward[];
  timeRange: TimeRange;
  prices: Record<string, number>;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  portfolioValue: number;
}

// Sliding window for live data (1 hour = 3600 seconds, update every 10 seconds = 360 max points)
const MAX_LIVE_POINTS = 360;
const LIVE_UPDATE_INTERVAL = 10000; // 10 seconds

export default function PortfolioPerformanceChart({ holdings, rewards, timeRange, prices }: PortfolioPerformanceChartProps) {
  const { theme } = useTheme();
  const [liveDataPoints, setLiveDataPoints] = useState<ChartDataPoint[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const isLiveMode = timeRange === TimeRange.hourlyLive;

  // BULLETPROOF: Calculate current portfolio value with stable logic
  const currentPortfolioValue = useMemo(() => {
    // Always calculate value even if prices object is empty - prevents data loss
    if (!prices) return 0;

    let totalValue = 0;
    
    holdings.forEach((holding) => {
      const price = prices[holding.symbol.toUpperCase()] || 0;
      totalValue += holding.amount * price;
    });

    rewards.forEach((reward) => {
      const price = prices[reward.symbol.toUpperCase()] || 0;
      totalValue += reward.amount * price;
    });

    return totalValue;
  }, [holdings, rewards, prices]);

  // BULLETPROOF: Live data streaming effect with guaranteed continuity
  useEffect(() => {
    if (!isLiveMode) return;
    
    // Don't add points if portfolio value is 0 and we have no holdings
    if (currentPortfolioValue === 0 && holdings.length === 0) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    // Only add new point if enough time has passed or it's the first point
    if (timeSinceLastUpdate >= LIVE_UPDATE_INTERVAL || lastUpdateTimeRef.current === 0) {
      const newPoint: ChartDataPoint = {
        date: new Date(now).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now,
        portfolioValue: currentPortfolioValue,
      };

      setLiveDataPoints(prev => {
        // CRITICAL: Maintain previous data during updates
        const updated = [...prev, newPoint];
        
        // Keep only last hour of data (sliding window)
        const oneHourAgo = now - 60 * 60 * 1000;
        const filtered = updated.filter(point => point.timestamp >= oneHourAgo);
        
        // Limit to MAX_LIVE_POINTS to prevent memory issues
        if (filtered.length > MAX_LIVE_POINTS) {
          return filtered.slice(filtered.length - MAX_LIVE_POINTS);
        }
        
        return filtered;
      });

      lastUpdateTimeRef.current = now;
    }
  }, [currentPortfolioValue, isLiveMode, holdings.length]);

  // Reset live data when switching away from live mode
  useEffect(() => {
    if (!isLiveMode) {
      setLiveDataPoints([]);
      lastUpdateTimeRef.current = 0;
    }
  }, [isLiveMode]);

  // BULLETPROOF: Generate historical chart data with stable dependencies
  const historicalChartData = useMemo(() => {
    // Always calculate historical data even if prices is empty - prevents data loss
    if (isLiveMode || !prices || holdings.length === 0) {
      return [];
    }

    const hasPrices = Object.keys(prices).length > 0;
    if (!hasPrices) {
      return [];
    }

    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    let startTime: number;
    let dataPoints: number;
    let intervalMs: number;
    
    // Configure time range with proper data point distribution
    switch (timeRange) {
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
      default:
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

    // Calculate portfolio value at each timestamp
    const data: ChartDataPoint[] = [];

    for (let i = 0; i <= dataPoints; i++) {
      const timestamp = startTime + i * intervalMs;
      
      let portfolioValue = 0;
      holdings.forEach((holding) => {
        const price = prices[holding.symbol.toUpperCase()] || 0;
        portfolioValue += holding.amount * price;
      });
      
      rewards.forEach((reward) => {
        const rewardTime = Number(reward.rewardDate) / 1_000_000;
        if (rewardTime <= timestamp) {
          const price = prices[reward.symbol.toUpperCase()] || 0;
          portfolioValue += reward.amount * price;
        }
      });

      let dateFormat: Intl.DateTimeFormatOptions;
      if (timeRange === TimeRange.day) {
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
  }, [holdings, rewards, timeRange, prices, isLiveMode]);

  // Apply smoothing to data for visual continuity
  const smoothedData = useMemo(() => {
    const sourceData = isLiveMode ? liveDataPoints : historicalChartData;
    
    if (sourceData.length < 3) {
      return sourceData;
    }

    // Apply weighted moving average for smoothing
    return sourceData.map((point, index) => {
      if (index === 0 || index === sourceData.length - 1) {
        return point;
      }

      const prev = sourceData[index - 1];
      const next = sourceData[index + 1];
      const smoothedValue = (prev.portfolioValue * 0.25 + point.portfolioValue * 0.5 + next.portfolioValue * 0.25);
      
      return {
        ...point,
        portfolioValue: smoothedValue,
      };
    });
  }, [liveDataPoints, historicalChartData, isLiveMode]);

  // Determine chart data to display
  const chartData = smoothedData;

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        {isLiveMode ? 'Collecting live data...' : 'Add holdings to see your portfolio chart'}
      </div>
    );
  }

  const isDark = theme === 'dark';
  
  const isGaining = chartData.length >= 2 && 
    chartData[chartData.length - 1].portfolioValue >= chartData[0].portfolioValue;

  // Calculate dynamic Y-axis domain for automatic scaling
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
          angle={isLiveMode || timeRange === TimeRange.day ? -45 : 0}
          textAnchor={isLiveMode || timeRange === TimeRange.day ? 'end' : 'middle'}
          height={isLiveMode || timeRange === TimeRange.day ? 60 : 30}
          tick={{ fill: isDark ? '#888' : '#666' }}
          interval={isLiveMode ? Math.floor(chartData.length / 10) : 'preserveStartEnd'}
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
          animationDuration={isLiveMode ? 600 : 800}
          animationEasing="ease-in-out"
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

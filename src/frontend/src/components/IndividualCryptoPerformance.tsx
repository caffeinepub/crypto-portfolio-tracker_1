import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CryptoHolding, StakingReward, TimeRange } from '../backend';
import { useTheme } from 'next-themes';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IndividualCryptoPerformanceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  holdings: CryptoHolding[];
  rewards: StakingReward[];
  prices: Record<string, number>;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

interface ChartDataPoint {
  date: string;
  price: number;
  value: number;
}

const timeRangeOptions = [
  { value: TimeRange.day, label: '1D' },
  { value: TimeRange.week, label: '1W' },
  { value: TimeRange.month, label: '1M' },
  { value: TimeRange.sixMonths, label: '6M' },
  { value: TimeRange.year, label: '1Y' },
  { value: TimeRange.allTime, label: 'All' },
];

export default function IndividualCryptoPerformance({
  open,
  onOpenChange,
  symbol,
  holdings,
  rewards,
  prices,
  timeRange,
  onTimeRangeChange,
}: IndividualCryptoPerformanceProps) {
  const { theme } = useTheme();

  const cryptoData = useMemo(() => {
    const upperSymbol = symbol.toUpperCase();
    const currentPrice = prices[upperSymbol] || 0;
    
    // Find holdings for this crypto
    const cryptoHoldings = holdings.filter(h => h.symbol.toUpperCase() === upperSymbol);
    const cryptoRewards = rewards.filter(r => r.symbol.toUpperCase() === upperSymbol);
    
    // Calculate total amount and invested
    const totalAmount = cryptoHoldings.reduce((sum, h) => sum + h.amount, 0) +
                       cryptoRewards.reduce((sum, r) => sum + r.amount, 0);
    const totalInvested = cryptoHoldings.reduce((sum, h) => sum + h.amountInvestedGBP, 0);
    const currentValue = totalAmount * currentPrice;
    const gainLoss = currentValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    return {
      totalAmount,
      totalInvested,
      currentValue,
      currentPrice,
      gainLoss,
      gainLossPercent,
      isPositive: gainLoss >= 0,
    };
  }, [symbol, holdings, rewards, prices]);

  const chartData = useMemo(() => {
    const upperSymbol = symbol.toUpperCase();
    const currentPrice = prices[upperSymbol] || 0;
    
    if (currentPrice === 0) {
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
        dataPoints = 7 * 4;
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
        startTime = now - 365 * msPerDay;
        dataPoints = 52;
        break;
    }

    const interval = (now - startTime) / dataPoints;
    const data: ChartDataPoint[] = [];

    // Calculate total amount held
    const cryptoHoldings = holdings.filter(h => h.symbol.toUpperCase() === upperSymbol);
    const cryptoRewards = rewards.filter(r => r.symbol.toUpperCase() === upperSymbol);
    const totalAmount = cryptoHoldings.reduce((sum, h) => sum + h.amount, 0) +
                       cryptoRewards.reduce((sum, r) => sum + r.amount, 0);

    // Generate data points (using current price - in a real app, you'd use historical prices)
    for (let i = 0; i <= dataPoints; i++) {
      const timestamp = startTime + i * interval;
      
      data.push({
        date: new Date(timestamp).toLocaleDateString('en-GB', {
          month: 'short',
          day: 'numeric',
          ...(timeRange === TimeRange.year || timeRange === TimeRange.allTime ? { year: '2-digit' } : {}),
        }),
        price: currentPrice,
        value: totalAmount * currentPrice,
      });
    }

    return data;
  }, [symbol, holdings, rewards, prices, timeRange]);

  const isDark = theme === 'dark';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{symbol.toUpperCase()} Performance</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Current Price</div>
              <div className="text-2xl font-bold">
                £{cryptoData.currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">
                {cryptoData.totalAmount.toFixed(8)}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Current Value</div>
              <div className="text-2xl font-bold">
                £{cryptoData.currentValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                Gain/Loss
                {cryptoData.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </div>
              <div className={`text-2xl font-bold ${cryptoData.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {cryptoData.isPositive ? '+' : ''}£{cryptoData.gainLoss.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs ${cryptoData.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {cryptoData.isPositive ? '+' : ''}{cryptoData.gainLossPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex justify-center gap-1">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onTimeRangeChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-lg border p-4">
            {chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No price data available for {symbol.toUpperCase()}
              </div>
            ) : (
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
                    tickFormatter={(value) => `£${value.toLocaleString('en-GB', { notation: 'compact' })}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#fff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: isDark ? '#fff' : '#000' }}
                    formatter={(value: number, name: string) => {
                      const label = name === 'price' ? 'Price' : 'Value';
                      return [`£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`, label];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Value"
                    stroke="oklch(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetHoldings, useGetStakingRewards } from '../hooks/useQueries';
import { TimeRange } from '../backend';
import { TrendingUp, TrendingDown, Wallet, PoundSterling } from 'lucide-react';
import PortfolioChart from './PortfolioChart';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

interface PortfolioOverviewProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const timeRangeOptions = [
  { value: TimeRange.day, label: '1D' },
  { value: TimeRange.week, label: '1W' },
  { value: TimeRange.month, label: '1M' },
  { value: TimeRange.sixMonths, label: '6M' },
  { value: TimeRange.year, label: '1Y' },
  { value: TimeRange.allTime, label: 'All' },
];

export default function PortfolioOverview({ timeRange, onTimeRangeChange }: PortfolioOverviewProps) {
  const { data: holdings = [] } = useGetHoldings();
  const { data: rewards = [] } = useGetStakingRewards();
  const { prices, isLoading: pricesLoading } = useCryptoPrices(holdings, rewards);

  const metrics = useMemo(() => {
    if (pricesLoading || !prices) {
      return { totalValue: 0, totalCost: 0, totalGainLoss: 0, percentageChange: 0 };
    }

    let totalValue = 0;
    let totalCost = 0;

    // Calculate holdings value
    holdings.forEach((holding) => {
      const price = prices[holding.symbol.toUpperCase()] || 0;
      totalValue += holding.amount * price;
      totalCost += holding.currentValueGBP;
    });

    // Add staking rewards value (assuming they were received at £0 cost)
    rewards.forEach((reward) => {
      const price = prices[reward.symbol.toUpperCase()] || 0;
      totalValue += reward.amount * price;
    });

    const totalGainLoss = totalValue - totalCost;
    const percentageChange = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalGainLoss, percentageChange };
  }, [holdings, rewards, prices, pricesLoading]);

  const isPositive = metrics.totalGainLoss >= 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{pricesLoading ? '...' : metrics.totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Current portfolio value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{metrics.totalCost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total invested</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gain/Loss</CardTitle>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}£{pricesLoading ? '...' : metrics.totalGainLoss.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Absolute change</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Change %</CardTitle>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{pricesLoading ? '...' : metrics.percentageChange.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Percentage change</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Portfolio Performance</CardTitle>
            <div className="flex gap-1">
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
          </div>
        </CardHeader>
        <CardContent>
          <PortfolioChart holdings={holdings} rewards={rewards} timeRange={timeRange} prices={prices} />
        </CardContent>
      </Card>
    </div>
  );
}

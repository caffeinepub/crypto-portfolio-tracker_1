import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CryptoHolding, StakingReward } from '../backend';

interface PortfolioCompositionChartProps {
  holdings: CryptoHolding[];
  rewards: StakingReward[];
  prices: Record<string, number>;
}

const COLORS = [
  'oklch(0.65 0.25 262)', // Primary purple
  'oklch(0.60 0.20 220)', // Blue
  'oklch(0.70 0.18 160)', // Green
  'oklch(0.65 0.22 50)',  // Orange
  'oklch(0.60 0.20 340)', // Pink
  'oklch(0.55 0.18 280)', // Deep purple
  'oklch(0.68 0.16 180)', // Cyan
  'oklch(0.62 0.20 30)',  // Yellow-orange
  'oklch(0.58 0.22 300)', // Magenta
  'oklch(0.66 0.15 140)', // Teal
];

export default function PortfolioCompositionChart({
  holdings,
  rewards,
  prices,
}: PortfolioCompositionChartProps) {
  const chartData = useMemo(() => {
    if (!prices || Object.keys(prices).length === 0) return [];

    // Calculate value for each holding using live prices
    const holdingValues = new Map<string, number>();

    holdings.forEach((holding) => {
      const price = prices[holding.symbol.toUpperCase()] || 0;
      const value = holding.amount * price;
      const currentValue = holdingValues.get(holding.symbol.toUpperCase()) || 0;
      holdingValues.set(holding.symbol.toUpperCase(), currentValue + value);
    });

    // Add staking rewards to the respective symbols
    rewards.forEach((reward) => {
      const price = prices[reward.symbol.toUpperCase()] || 0;
      const value = reward.amount * price;
      const currentValue = holdingValues.get(reward.symbol.toUpperCase()) || 0;
      holdingValues.set(reward.symbol.toUpperCase(), currentValue + value);
    });

    // Calculate total portfolio value
    const totalValue = Array.from(holdingValues.values()).reduce((sum, val) => sum + val, 0);

    if (totalValue === 0) return [];

    // Convert to chart data format with percentages
    const data = Array.from(holdingValues.entries())
      .map(([symbol, value]) => ({
        name: symbol,
        value: value,
        percentage: (value / totalValue) * 100,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return data;
  }, [holdings, rewards, prices]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No portfolio data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            £{data.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm font-medium">
            {data.percentage.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.value} ({entry.payload.percentage.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

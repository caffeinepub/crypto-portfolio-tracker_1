import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart2, Eye } from 'lucide-react';
import { CryptoHolding, StakingReward } from '../backend';
import { useCryptoPrices, getGBPPrice, get24hChange } from '../hooks/useCryptoPrices';
import PortfolioChart from './PortfolioChart';
import PortfolioPerformanceChart from './PortfolioPerformanceChart';
import PortfolioCompositionChart from './PortfolioCompositionChart';
import IndividualCryptoPerformance from './IndividualCryptoPerformance';

interface PortfolioOverviewProps {
  holdings: CryptoHolding[];
  stakingRewards: StakingReward[];
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TIME_RANGES: TimeRange[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

function formatGBP(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0.00%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function PortfolioOverview({ holdings, stakingRewards }: PortfolioOverviewProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1M');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Collect all unique symbols from holdings and staking rewards
  const allSymbols = [
    ...new Set([
      ...holdings.map(h => h.symbol.toUpperCase()),
      ...stakingRewards.map(r => r.symbol.toUpperCase()),
    ]),
  ];

  const { data: prices, isLoading: pricesLoading } = useCryptoPrices(allSymbols);

  // Calculate current value for each holding using live prices
  const holdingsWithLiveValues = holdings.map(h => {
    const livePrice = getGBPPrice(prices, h.symbol);
    const currentValueGBP = livePrice > 0 ? livePrice * h.amount : h.currentValueGBP;
    return { ...h, currentValueGBP };
  });

  // Calculate staking reward values using live prices
  const stakingWithLiveValues = stakingRewards.map(r => {
    const livePrice = getGBPPrice(prices, r.symbol);
    const currentValueGBP = livePrice > 0 ? livePrice * r.amount : 0;
    return { ...r, currentValueGBP };
  });

  // Portfolio totals
  const totalHoldingsValue = holdingsWithLiveValues.reduce((sum, h) => sum + (isFinite(h.currentValueGBP) ? h.currentValueGBP : 0), 0);
  const totalStakingValue = stakingWithLiveValues.reduce((sum, r) => sum + (isFinite(r.currentValueGBP) ? r.currentValueGBP : 0), 0);
  const totalPortfolioValue = totalHoldingsValue + totalStakingValue;

  const totalInvested = holdings.reduce((sum, h) => sum + (isFinite(h.amountInvestedGBP) ? h.amountInvestedGBP : 0), 0);

  const totalGainLoss = totalPortfolioValue - totalInvested;
  const gainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const isPositive = totalGainLoss >= 0;

  // Group holdings by symbol for asset cards
  const symbolMap: Record<string, { amount: number; invested: number; currentValue: number }> = {};
  for (const h of holdingsWithLiveValues) {
    const sym = h.symbol.toUpperCase();
    if (!symbolMap[sym]) {
      symbolMap[sym] = { amount: 0, invested: 0, currentValue: 0 };
    }
    symbolMap[sym].amount += h.amount;
    symbolMap[sym].invested += isFinite(h.amountInvestedGBP) ? h.amountInvestedGBP : 0;
    symbolMap[sym].currentValue += isFinite(h.currentValueGBP) ? h.currentValueGBP : 0;
  }

  // Add staking rewards to symbol map
  for (const r of stakingWithLiveValues) {
    const sym = r.symbol.toUpperCase();
    if (!symbolMap[sym]) {
      symbolMap[sym] = { amount: 0, invested: 0, currentValue: 0 };
    }
    symbolMap[sym].amount += r.amount;
    symbolMap[sym].currentValue += isFinite(r.currentValueGBP) ? r.currentValueGBP : 0;
  }

  const assetCards = Object.entries(symbolMap).sort((a, b) => b[1].currentValue - a[1].currentValue);

  const getCryptoLogo = (symbol: string) => {
    const lower = symbol.toLowerCase();
    return `/assets/generated/${lower}-logo-transparent.dim_64x64.png`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Portfolio Value */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Total Portfolio Value</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {pricesLoading && totalPortfolioValue === 0 ? (
              <span className="text-muted-foreground text-lg">Loading...</span>
            ) : (
              formatGBP(totalPortfolioValue)
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Holdings: {formatGBP(totalHoldingsValue)} · Staking: {formatGBP(totalStakingValue)}
          </div>
        </div>

        {/* Total Invested */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Total Invested</span>
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-secondary-foreground" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatGBP(totalInvested)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across {holdings.length} holding{holdings.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Gain / Loss */}
        <div className={`bg-card border rounded-2xl p-5 shadow-card ${isPositive ? 'border-success/30' : 'border-destructive/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Total Gain / Loss</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {formatGBP(totalGainLoss)}
          </div>
          <div className={`text-xs mt-1 font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {formatPercent(gainLossPercent)}
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-1">Range:</span>
        {TIME_RANGES.map(range => (
          <button
            key={range}
            onClick={() => setSelectedTimeRange(range)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedTimeRange === range
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Portfolio Value Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Portfolio Value
          </h3>
          <PortfolioChart
            totalInvestedGBP={totalInvested}
            currentValueGBP={totalPortfolioValue}
            timeRange={selectedTimeRange}
          />
        </div>

        {/* Composition Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Composition
          </h3>
          <PortfolioCompositionChart
            holdings={holdingsWithLiveValues}
            stakingRewards={stakingWithLiveValues}
            prices={prices}
          />
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          Performance Overview
        </h3>
        <PortfolioPerformanceChart
          totalInvestedGBP={totalInvested}
          currentValueGBP={totalPortfolioValue}
          timeRange={selectedTimeRange}
        />
      </div>

      {/* Asset Cards */}
      {assetCards.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Assets
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {assetCards.map(([symbol, data]) => {
              const livePrice = getGBPPrice(prices, symbol);
              const change24h = get24hChange(prices, symbol);
              const isUp = change24h >= 0;
              const gainLoss = data.currentValue - data.invested;
              const gainLossPct = data.invested > 0 ? (gainLoss / data.invested) * 100 : 0;

              return (
                <button
                  key={symbol}
                  onClick={() => setSelectedSymbol(symbol)}
                  className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary/50 hover:shadow-glow transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={getCryptoLogo(symbol)}
                      alt={symbol}
                      className="w-7 h-7 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="font-bold text-sm text-foreground">{symbol}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatGBP(data.currentValue)}
                  </div>
                  {livePrice > 0 && (
                    <div className="text-xs text-muted-foreground">
                      @ {formatGBP(livePrice)}
                    </div>
                  )}
                  <div className={`text-xs font-medium mt-1 ${isUp ? 'text-success' : 'text-destructive'}`}>
                    {isUp ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% 24h
                  </div>
                  {data.invested > 0 && (
                    <div className={`text-xs mt-0.5 ${gainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {gainLoss >= 0 ? '+' : ''}{formatGBP(gainLoss)} ({gainLossPct >= 0 ? '+' : ''}{gainLossPct.toFixed(1)}%)
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Crypto Performance Modal */}
      {selectedSymbol && (
        <IndividualCryptoPerformance
          symbol={selectedSymbol}
          holdings={holdingsWithLiveValues}
          stakingRewards={stakingWithLiveValues}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}

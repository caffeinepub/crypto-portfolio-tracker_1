import { useMemo } from 'react';
import { useGetHoldings, useGetStakingRewards } from '../hooks/useQueries';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useCryptoPrices } from '../hooks/useCryptoPrices';

// Crypto logo mapping
const CRYPTO_LOGOS: Record<string, string> = {
  BTC: '/assets/generated/btc-logo-transparent.dim_64x64.png',
  ETH: '/assets/generated/eth-logo-transparent.dim_64x64.png',
  ADA: '/assets/generated/ada-logo-transparent.dim_64x64.png',
  SOL: '/assets/generated/sol-logo-transparent.dim_64x64.png',
  DOT: '/assets/generated/dot-logo-transparent.dim_64x64.png',
  AVAX: '/assets/generated/avax-logo-transparent.dim_64x64.png',
  MATIC: '/assets/generated/matic-logo-transparent.dim_64x64.png',
  XRP: '/assets/generated/xrp-logo-transparent.dim_64x64.png',
  SUI: '/assets/generated/sui-logo-transparent.dim_64x64.png',
  ICP: '/assets/generated/icp-logo-transparent.dim_64x64.png',
  XTZ: '/assets/generated/xtz-logo-transparent.dim_64x64.png',
  BONK: '/assets/generated/bonk-logo-transparent.dim_64x64.png',
  AMP: '/assets/generated/amp-logo-transparent.dim_64x64.png',
  ONYX: '/assets/generated/onyx-logo-transparent.dim_64x64.png',
  XCN: '/assets/generated/onyx-logo-transparent.dim_64x64.png',
};

export default function PortfolioOverview() {
  const { data: holdings = [], isLoading: holdingsLoading } = useGetHoldings();
  const { data: rewards = [], isLoading: rewardsLoading } = useGetStakingRewards();
  const { prices, isLoading: pricesLoading, isFetching: pricesFetching } = useCryptoPrices(holdings, rewards);

  // BULLETPROOF: Calculate metrics with stable dependencies to prevent recalculation issues
  const { metrics, assetCards } = useMemo(() => {
    // Always calculate metrics even during price updates - prevents data disappearance
    const hasPrices = Object.keys(prices).length > 0;
    
    if (!hasPrices) {
      return { 
        metrics: { totalValue: 0, totalCost: 0, totalGainLoss: 0, percentageChange: 0 },
        assetCards: []
      };
    }

    let totalValue = 0;
    let totalCost = 0;

    // Group holdings and rewards by symbol for card display
    const assetMap = new Map<string, { 
      symbol: string; 
      amount: number; 
      invested: number; 
      currentValue: number;
      gainLoss: number;
      gainLossPercent: number;
    }>();

    // Process holdings
    holdings.forEach((holding) => {
      const symbol = holding.symbol.toUpperCase();
      const price = prices[symbol] || 0;
      const currentValueGBP = holding.amount * price;
      
      totalValue += currentValueGBP;
      totalCost += holding.amountInvestedGBP;

      const existing = assetMap.get(symbol);
      if (existing) {
        existing.amount += holding.amount;
        existing.invested += holding.amountInvestedGBP;
        existing.currentValue += currentValueGBP;
      } else {
        assetMap.set(symbol, {
          symbol,
          amount: holding.amount,
          invested: holding.amountInvestedGBP,
          currentValue: currentValueGBP,
          gainLoss: 0,
          gainLossPercent: 0,
        });
      }
    });

    // Add staking rewards value (assuming they were received at £0 cost)
    rewards.forEach((reward) => {
      const symbol = reward.symbol.toUpperCase();
      const price = prices[symbol] || 0;
      const rewardValue = reward.amount * price;
      totalValue += rewardValue;

      const existing = assetMap.get(symbol);
      if (existing) {
        existing.amount += reward.amount;
        existing.currentValue += rewardValue;
      } else {
        assetMap.set(symbol, {
          symbol,
          amount: reward.amount,
          invested: 0,
          currentValue: rewardValue,
          gainLoss: 0,
          gainLossPercent: 0,
        });
      }
    });

    // Calculate gain/loss for each asset
    assetMap.forEach((asset) => {
      asset.gainLoss = asset.currentValue - asset.invested;
      asset.gainLossPercent = asset.invested > 0 ? (asset.gainLoss / asset.invested) * 100 : 0;
    });

    const totalGainLoss = totalValue - totalCost;
    const percentageChange = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Convert to array and sort by current value
    const assetCards = Array.from(assetMap.values())
      .sort((a, b) => b.currentValue - a.currentValue);

    return { 
      metrics: { totalValue, totalCost, totalGainLoss, percentageChange },
      assetCards
    };
  }, [holdings, rewards, prices]); // STABLE: Only recalculate when actual data changes

  const isPositive = metrics.totalGainLoss >= 0;
  // Only show initial loading when we have no data at all
  const isInitialLoading = holdingsLoading || rewardsLoading || (pricesLoading && Object.keys(prices).length === 0);

  return (
    <div className="space-y-6">
      {/* Portfolio Metrics Section with Minimalist Gradient */}
      <div className="relative overflow-hidden rounded-3xl p-8 border border-border/50 shadow-elevated bg-card backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/8 to-transparent rounded-full blur-3xl -z-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className={`h-5 w-5 text-primary ${pricesFetching ? 'animate-pulse-glow' : ''}`} />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Portfolio Value</span>
            {pricesFetching && !isInitialLoading && (
              <span className="text-xs text-primary font-medium animate-pulse">Updating...</span>
            )}
          </div>
          <div className="text-5xl md:text-6xl font-bold mb-3 animate-fade-in-glow">
            {isInitialLoading ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                £{metrics.totalValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isInitialLoading ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <>
                {isPositive ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                <span className="text-xl">
                  {isPositive ? '+' : ''}£{metrics.totalGainLoss.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-base font-semibold">
                  ({isPositive ? '+' : ''}{metrics.percentageChange.toFixed(2)}%)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modern Dark Theme Asset Cards Grid */}
      {assetCards.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-5 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Your Assets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {assetCards.map((asset) => {
              const isAssetPositive = asset.gainLoss >= 0;
              const logo = CRYPTO_LOGOS[asset.symbol];
              
              return (
                <div
                  key={asset.symbol}
                  className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-fade-in"
                >
                  {/* Subtle gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {logo ? (
                          <div className="p-1.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                            <img src={logo} alt={asset.symbol} className="w-10 h-10 rounded-lg" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border border-primary/20 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{asset.symbol.slice(0, 2)}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-lg text-foreground">{asset.symbol}</div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {asset.amount.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-foreground animate-value-change">
                        £{asset.currentValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`flex items-center gap-1.5 text-sm font-bold ${isAssetPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isAssetPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>
                          {isAssetPositive ? '+' : ''}£{Math.abs(asset.gainLoss).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs font-semibold">
                          ({isAssetPositive ? '+' : ''}{asset.gainLossPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

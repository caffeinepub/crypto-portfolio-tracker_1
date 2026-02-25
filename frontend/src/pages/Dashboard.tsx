import React from 'react';
import { useGetHoldings, useGetStakingRewards } from '../hooks/useQueries';
import PortfolioOverview from '../components/PortfolioOverview';
import HoldingsManager from '../components/HoldingsManager';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: holdings = [], isLoading: holdingsLoading } = useGetHoldings();
  const { data: stakingRewards = [], isLoading: rewardsLoading } = useGetStakingRewards();

  const isLoading = holdingsLoading || rewardsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        {/* Table skeleton */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PortfolioOverview
        holdings={holdings}
        stakingRewards={stakingRewards}
      />
      <HoldingsManager
        holdings={holdings}
        stakingRewards={stakingRewards}
      />
    </div>
  );
}

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortfolioOverview from '../components/PortfolioOverview';
import HoldingsManager from '../components/HoldingsManager';
import StakingRewardsManager from '../components/StakingRewardsManager';
import { TimeRange } from '../backend';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.allTime);

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Portfolio Dashboard</h2>
        <p className="text-muted-foreground">Track and manage your cryptocurrency investments</p>
      </div>

      <PortfolioOverview timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      <Tabs defaultValue="holdings" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="rewards">Staking Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings" className="space-y-4">
          <HoldingsManager />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <StakingRewardsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

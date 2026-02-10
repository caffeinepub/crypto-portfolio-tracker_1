import PortfolioOverview from '../components/PortfolioOverview';
import HoldingsManager from '../components/HoldingsManager';

export default function Dashboard() {
  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Portfolio Dashboard
        </h2>
        <p className="text-muted-foreground text-lg font-medium">Track and manage your cryptocurrency investments</p>
      </div>

      <PortfolioOverview />

      <HoldingsManager />
    </div>
  );
}

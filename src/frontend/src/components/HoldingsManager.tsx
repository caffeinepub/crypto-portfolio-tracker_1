import { useState, useMemo } from 'react';
import { useGetHoldings, useDeleteHolding } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, ArrowUpDown, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import IncrementHoldingDialog from './IncrementHoldingDialog';
import IndividualCryptoPerformance from './IndividualCryptoPerformance';
import { CryptoHolding, TimeRange } from '../backend';
import { toast } from 'sonner';
import { useCryptoPrices } from '../hooks/useCryptoPrices';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useGetStakingRewards } from '../hooks/useQueries';

type SortOption = 'highest-value' | 'lowest-value' | 'highest-gain' | 'lowest-gain' | 'none';

export default function HoldingsManager() {
  const { data: holdings = [], isLoading } = useGetHoldings();
  const { data: rewards = [] } = useGetStakingRewards();
  const deleteHolding = useDeleteHolding();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [incrementDialogOpen, setIncrementDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<CryptoHolding | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const [cryptoTimeRange, setCryptoTimeRange] = useState<TimeRange>(TimeRange.month);
  const { prices, isLoading: pricesLoading } = useCryptoPrices(holdings, rewards);

  const sortedHoldings = useMemo(() => {
    if (sortOption === 'none') return holdings;

    const holdingsWithMetrics = holdings.map((holding) => {
      const currentPrice = prices[holding.symbol.toUpperCase()] || 0;
      const currentValue = holding.amount * currentPrice;
      const gainLoss = currentValue - holding.amountInvestedGBP;
      return { holding, currentValue, gainLoss };
    });

    switch (sortOption) {
      case 'highest-value':
        return holdingsWithMetrics
          .sort((a, b) => b.currentValue - a.currentValue)
          .map((item) => item.holding);
      case 'lowest-value':
        return holdingsWithMetrics
          .sort((a, b) => a.currentValue - b.currentValue)
          .map((item) => item.holding);
      case 'highest-gain':
        return holdingsWithMetrics
          .sort((a, b) => b.gainLoss - a.gainLoss)
          .map((item) => item.holding);
      case 'lowest-gain':
        return holdingsWithMetrics
          .sort((a, b) => a.gainLoss - b.gainLoss)
          .map((item) => item.holding);
      default:
        return holdings;
    }
  }, [holdings, prices, sortOption]);

  const getSortLabel = () => {
    switch (sortOption) {
      case 'highest-value':
        return 'Highest Value';
      case 'lowest-value':
        return 'Lowest Value';
      case 'highest-gain':
        return 'Highest Gain/Loss';
      case 'lowest-gain':
        return 'Lowest Gain/Loss';
      default:
        return 'Sort By';
    }
  };

  const handleEdit = (holding: CryptoHolding) => {
    setSelectedHolding(holding);
    setEditDialogOpen(true);
  };

  const handleIncrement = (holding: CryptoHolding) => {
    setSelectedHolding(holding);
    setIncrementDialogOpen(true);
  };

  const handleDeleteClick = (holding: CryptoHolding) => {
    setSelectedHolding(holding);
    setDeleteDialogOpen(true);
  };

  const handleViewPerformance = (symbol: string) => {
    setSelectedSymbol(symbol);
    setPerformanceDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedHolding) return;

    try {
      await deleteHolding.mutateAsync(selectedHolding.id);
      toast.success('Holding deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedHolding(null);
    } catch (error) {
      toast.error('Failed to delete holding');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-card">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground font-medium">Loading holdings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-2xl border-border/50 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Crypto Holdings</CardTitle>
              <CardDescription className="text-base font-medium">Manage your cryptocurrency portfolio</CardDescription>
            </div>
            <div className="flex gap-2">
              {holdings.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-xl font-semibold">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      {getSortLabel()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setSortOption('highest-value')} className="font-medium">
                      Highest Current Value
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('lowest-value')} className="font-medium">
                      Lowest Current Value
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('highest-gain')} className="font-medium">
                      Highest Gain/Loss
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('lowest-gain')} className="font-medium">
                      Lowest Gain/Loss
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('none')} className="font-medium">
                      Default Order
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button onClick={() => setAddDialogOpen(true)} className="rounded-xl font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                Add Holding
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-medium">
              No holdings yet. Add your first cryptocurrency holding to get started.
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold">Symbol</TableHead>
                    <TableHead className="text-right font-bold">Amount</TableHead>
                    <TableHead className="text-right font-bold">Amount Invested (£)</TableHead>
                    <TableHead className="text-right font-bold">Current Price</TableHead>
                    <TableHead className="text-right font-bold">Current Value</TableHead>
                    <TableHead className="text-right font-bold">Gain/Loss</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHoldings.map((holding) => {
                    const currentPrice = prices[holding.symbol.toUpperCase()] || 0;
                    const currentValueGBP = holding.amount * currentPrice;
                    const gainLoss = currentValueGBP - holding.amountInvestedGBP;
                    const gainLossPercent = holding.amountInvestedGBP > 0 
                      ? (gainLoss / holding.amountInvestedGBP) * 100 
                      : 0;
                    const isPositive = gainLoss >= 0;

                    return (
                      <TableRow key={Number(holding.id)} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-bold">
                          <button
                            onClick={() => handleViewPerformance(holding.symbol)}
                            className="flex items-center gap-1.5 hover:text-primary transition-colors font-semibold"
                          >
                            {holding.symbol.toUpperCase()}
                            <TrendingUp className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                        <TableCell className="text-right font-medium">{holding.amount.toFixed(8)}</TableCell>
                        <TableCell className="text-right font-semibold">£{holding.amountInvestedGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right font-medium">
                          {pricesLoading ? (
                            <span className="text-muted-foreground">Loading...</span>
                          ) : currentPrice > 0 ? (
                            `£${currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {pricesLoading ? (
                            <span className="text-muted-foreground">Loading...</span>
                          ) : currentPrice > 0 ? (
                            `£${currentValueGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {pricesLoading ? (
                            <span className="text-muted-foreground">Loading...</span>
                          ) : currentPrice > 0 ? (
                            <>
                              {isPositive ? '+' : ''}£{gainLoss.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span className="text-xs ml-1 font-semibold">
                                ({isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                              </span>
                            </>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleIncrement(holding)} className="rounded-lg hover:bg-primary/10">
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(holding)} className="rounded-lg hover:bg-secondary/10">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(holding)}
                              disabled={deleteHolding.isPending}
                              className="rounded-lg hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddHoldingDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {selectedHolding && (
        <>
          <EditHoldingDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            holding={selectedHolding}
          />
          <IncrementHoldingDialog
            open={incrementDialogOpen}
            onOpenChange={setIncrementDialogOpen}
            holding={selectedHolding}
          />
        </>
      )}

      <IndividualCryptoPerformance
        open={performanceDialogOpen}
        onOpenChange={setPerformanceDialogOpen}
        symbol={selectedSymbol}
        holdings={holdings}
        rewards={rewards}
        prices={prices}
        timeRange={cryptoTimeRange}
        onTimeRangeChange={setCryptoTimeRange}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Holding</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this holding? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteHolding.isPending} className="rounded-xl font-semibold">
              {deleteHolding.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


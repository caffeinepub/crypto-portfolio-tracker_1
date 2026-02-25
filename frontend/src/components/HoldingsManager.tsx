import React, { useState } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, PlusCircle } from 'lucide-react';
import { CryptoHolding, StakingReward } from '../backend';
import { useCryptoPrices, getGBPPrice, get24hChange } from '../hooks/useCryptoPrices';
import { useDeleteHolding } from '../hooks/useQueries';
import AddHoldingDialog from './AddHoldingDialog';
import EditHoldingDialog from './EditHoldingDialog';
import IncrementHoldingDialog from './IncrementHoldingDialog';
import StakingRewardsManager from './StakingRewardsManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HoldingsManagerProps {
  holdings: CryptoHolding[];
  stakingRewards: StakingReward[];
}

function formatGBP(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmount(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0';
  if (value < 0.0001) return value.toExponential(4);
  if (value < 1) return value.toFixed(6);
  if (value < 1000) return value.toFixed(4);
  return value.toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

export default function HoldingsManager({ holdings, stakingRewards }: HoldingsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editHolding, setEditHolding] = useState<CryptoHolding | null>(null);
  const [incrementHolding, setIncrementHolding] = useState<CryptoHolding | null>(null);

  const deleteHolding = useDeleteHolding();

  // Get all unique symbols for live price fetching
  const allSymbols = [...new Set(holdings.map(h => h.symbol.toUpperCase()))];
  const { data: prices } = useCryptoPrices(allSymbols);

  // Compute live current value for each holding
  const holdingsWithLive = holdings.map(h => {
    const livePrice = getGBPPrice(prices, h.symbol);
    const currentValueGBP = livePrice > 0 ? livePrice * h.amount : h.currentValueGBP;
    return { ...h, currentValueGBP };
  });

  // Sort by current value descending
  const sortedHoldings = [...holdingsWithLive].sort((a, b) => b.currentValueGBP - a.currentValueGBP);

  const getCryptoLogo = (symbol: string) => {
    const lower = symbol.toLowerCase();
    return `/assets/generated/${lower}-logo-transparent.dim_64x64.png`;
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
      <Tabs defaultValue="holdings">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="staking">Staking Rewards</TabsTrigger>
          </TabsList>
          <TabsContent value="holdings" className="mt-0">
            <Button
              size="sm"
              onClick={() => setShowAddDialog(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Holding
            </Button>
          </TabsContent>
        </div>

        <TabsContent value="holdings" className="mt-0">
          {sortedHoldings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No holdings yet</p>
              <p className="text-muted-foreground text-xs mt-1">Add your first crypto holding to get started</p>
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4" />
                Add Holding
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs font-semibold">Asset</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Price</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">24h</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Current Value</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Invested</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Gain / Loss</TableHead>
                    <TableHead className="text-muted-foreground text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHoldings.map(holding => {
                    const livePrice = getGBPPrice(prices, holding.symbol);
                    const change24h = get24hChange(prices, holding.symbol);
                    const isUp24h = change24h >= 0;

                    const currentValue = holding.currentValueGBP;
                    const invested = isFinite(holding.amountInvestedGBP) ? holding.amountInvestedGBP : 0;
                    const gainLoss = currentValue - invested;
                    const gainLossPct = invested > 0 ? (gainLoss / invested) * 100 : 0;
                    const isGain = gainLoss >= 0;

                    return (
                      <TableRow key={String(holding.id)} className="border-border hover:bg-muted/30 transition-colors">
                        {/* Asset */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getCryptoLogo(holding.symbol)}
                              alt={holding.symbol}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div>
                              <div className="font-semibold text-sm text-foreground">{holding.symbol.toUpperCase()}</div>
                              <div className="text-xs text-muted-foreground">{formatAmount(holding.amount)} tokens</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="text-right text-sm text-foreground font-mono">
                          {formatAmount(holding.amount)}
                        </TableCell>

                        {/* Live Price */}
                        <TableCell className="text-right text-sm text-foreground">
                          {livePrice > 0 ? formatGBP(livePrice) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>

                        {/* 24h Change */}
                        <TableCell className="text-right">
                          {prices ? (
                            <span className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${isUp24h ? 'text-success' : 'text-destructive'}`}>
                              {isUp24h ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(change24h).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Current Value */}
                        <TableCell className="text-right text-sm font-semibold text-foreground">
                          {formatGBP(currentValue)}
                        </TableCell>

                        {/* Invested */}
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatGBP(invested)}
                        </TableCell>

                        {/* Gain / Loss */}
                        <TableCell className="text-right">
                          <div className={`text-sm font-semibold ${isGain ? 'text-success' : 'text-destructive'}`}>
                            {isGain ? '+' : ''}{formatGBP(gainLoss)}
                          </div>
                          <div className={`text-xs ${isGain ? 'text-success' : 'text-destructive'}`}>
                            {isGain ? '+' : ''}{gainLossPct.toFixed(2)}%
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => setIncrementHolding(holding)}
                              title="Add more"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => setEditHolding(holding)}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Holding</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete your {holding.symbol.toUpperCase()} holding? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteHolding.mutate(holding.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="staking" className="mt-0">
          <StakingRewardsManager stakingRewards={stakingRewards} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showAddDialog && (
        <AddHoldingDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      )}
      {editHolding && (
        <EditHoldingDialog
          open={!!editHolding}
          onOpenChange={(open) => !open && setEditHolding(null)}
          holding={editHolding}
        />
      )}
      {incrementHolding && (
        <IncrementHoldingDialog
          open={!!incrementHolding}
          onOpenChange={(open) => !open && setIncrementHolding(null)}
          holding={incrementHolding}
        />
      )}
    </div>
  );
}

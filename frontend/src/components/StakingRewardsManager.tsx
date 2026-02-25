import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import { StakingReward } from '../backend';
import { useCryptoPrices, getGBPPrice } from '../hooks/useCryptoPrices';
import { useDeleteStakingReward } from '../hooks/useQueries';
import AddStakingRewardDialog from './AddStakingRewardDialog';
import EditStakingRewardDialog from './EditStakingRewardDialog';
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

interface StakingRewardsManagerProps {
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

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000; // nanoseconds to ms
  const date = new Date(ms);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StakingRewardsManager({ stakingRewards }: StakingRewardsManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editReward, setEditReward] = useState<StakingReward | null>(null);

  const deleteReward = useDeleteStakingReward();

  const allSymbols = [...new Set(stakingRewards.map(r => r.symbol.toUpperCase()))];
  const { data: prices } = useCryptoPrices(allSymbols);

  // Sort by reward date descending
  const sortedRewards = [...stakingRewards].sort((a, b) => Number(b.rewardDate) - Number(a.rewardDate));

  const totalStakingValue = sortedRewards.reduce((sum, r) => {
    const livePrice = getGBPPrice(prices, r.symbol);
    const val = livePrice > 0 ? livePrice * r.amount : 0;
    return sum + (isFinite(val) ? val : 0);
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Staking Rewards</span>
          {totalStakingValue > 0 && (
            <span className="text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-full">
              {formatGBP(totalStakingValue)} total
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Add Reward
        </Button>
      </div>

      {sortedRewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Award className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No staking rewards yet</p>
          <p className="text-muted-foreground text-xs mt-1">Track your staking rewards here</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4" />
            Add Reward
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs font-semibold">Asset</TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold text-right">Amount</TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold text-right">Live Price</TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold text-right">Current Value</TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold text-right">Reward Date</TableHead>
                <TableHead className="text-muted-foreground text-xs font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRewards.map(reward => {
                const livePrice = getGBPPrice(prices, reward.symbol);
                const currentValue = livePrice > 0 ? livePrice * reward.amount : 0;

                return (
                  <TableRow key={String(reward.id)} className="border-border hover:bg-muted/30 transition-colors">
                    {/* Asset */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <img
                          src={`/assets/generated/${reward.symbol.toLowerCase()}-logo-transparent.dim_64x64.png`}
                          alt={reward.symbol}
                          className="w-7 h-7 rounded-full"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="font-semibold text-sm text-foreground">{reward.symbol.toUpperCase()}</span>
                      </div>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right text-sm font-mono text-foreground">
                      {formatAmount(reward.amount)}
                    </TableCell>

                    {/* Live Price */}
                    <TableCell className="text-right text-sm text-foreground">
                      {livePrice > 0 ? formatGBP(livePrice) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>

                    {/* Current Value */}
                    <TableCell className="text-right text-sm font-semibold text-success">
                      {currentValue > 0 ? formatGBP(currentValue) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>

                    {/* Reward Date */}
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(reward.rewardDate)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setEditReward(reward)}
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
                              <AlertDialogTitle>Delete Staking Reward</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this {reward.symbol.toUpperCase()} staking reward? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReward.mutate(reward.id)}
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

      {showAddDialog && (
        <AddStakingRewardDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      )}
      {editReward && (
        <EditStakingRewardDialog
          open={!!editReward}
          onOpenChange={(open) => !open && setEditReward(null)}
          reward={editReward}
        />
      )}
    </div>
  );
}

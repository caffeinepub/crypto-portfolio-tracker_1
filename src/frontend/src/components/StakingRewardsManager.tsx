import { useState } from 'react';
import { useGetStakingRewards, useDeleteStakingReward } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import AddStakingRewardDialog from './AddStakingRewardDialog';
import EditStakingRewardDialog from './EditStakingRewardDialog';
import { StakingReward } from '../backend';
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

export default function StakingRewardsManager() {
  const { data: rewards = [], isLoading } = useGetStakingRewards();
  const deleteReward = useDeleteStakingReward();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<StakingReward | null>(null);
  const { prices } = useCryptoPrices([], rewards);

  const handleEdit = (reward: StakingReward) => {
    setSelectedReward(reward);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (reward: StakingReward) => {
    setSelectedReward(reward);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReward) return;

    try {
      await deleteReward.mutateAsync(selectedReward.id);
      toast.success('Staking reward deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedReward(null);
    } catch (error) {
      toast.error('Failed to delete staking reward');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading staking rewards...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staking Rewards</CardTitle>
              <CardDescription>Track your cryptocurrency staking rewards</CardDescription>
            </div>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reward
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No staking rewards yet. Add your first reward to track your earnings.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead>Reward Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => {
                    const currentPrice = prices?.[reward.symbol.toUpperCase()] || 0;
                    const currentValue = reward.amount * currentPrice;

                    return (
                      <TableRow key={Number(reward.id)}>
                        <TableCell className="font-medium">{reward.symbol.toUpperCase()}</TableCell>
                        <TableCell className="text-right">{reward.amount.toFixed(8)}</TableCell>
                        <TableCell className="text-right">£{currentPrice.toLocaleString('en-GB')}</TableCell>
                        <TableCell className="text-right">
                          £{currentValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {new Date(Number(reward.rewardDate) / 1_000_000).toLocaleDateString('en-GB')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(reward)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(reward)}
                              disabled={deleteReward.isPending}
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

      <AddStakingRewardDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
      {selectedReward && (
        <EditStakingRewardDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          reward={selectedReward}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staking Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staking reward? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteReward.isPending}>
              {deleteReward.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

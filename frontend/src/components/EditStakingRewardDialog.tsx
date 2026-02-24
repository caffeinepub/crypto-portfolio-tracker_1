import { useState, useEffect } from 'react';
import { useUpdateStakingReward } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StakingReward } from '../backend';
import { toast } from 'sonner';

interface EditStakingRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: StakingReward;
}

export default function EditStakingRewardDialog({ open, onOpenChange, reward }: EditStakingRewardDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [rewardDate, setRewardDate] = useState('');
  const updateReward = useUpdateStakingReward();

  useEffect(() => {
    if (reward) {
      setSymbol(reward.symbol);
      setAmount(reward.amount.toString());
      const date = new Date(Number(reward.rewardDate) / 1_000_000);
      setRewardDate(date.toISOString().split('T')[0]);
    }
  }, [reward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim() || !amount || !rewardDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const dateMs = new Date(rewardDate).getTime();
      const dateNs = BigInt(dateMs) * BigInt(1_000_000);

      await updateReward.mutateAsync({
        id: reward.id,
        symbol: symbol.trim().toUpperCase(),
        amount: amountNum,
        rewardDate: dateNs,
      });

      toast.success('Staking reward updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update staking reward');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Staking Reward</DialogTitle>
          <DialogDescription>Update your staking reward details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-reward-symbol">Symbol</Label>
              <Input
                id="edit-reward-symbol"
                placeholder="BTC, ETH, etc."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={updateReward.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reward-amount">Amount</Label>
              <Input
                id="edit-reward-amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={updateReward.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reward-date">Reward Date</Label>
              <Input
                id="edit-reward-date"
                type="date"
                value={rewardDate}
                onChange={(e) => setRewardDate(e.target.value)}
                disabled={updateReward.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateReward.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateReward.isPending}>
              {updateReward.isPending ? 'Updating...' : 'Update Reward'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

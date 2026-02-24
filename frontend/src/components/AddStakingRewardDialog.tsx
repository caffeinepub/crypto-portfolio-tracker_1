import { useState } from 'react';
import { useAddStakingReward } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddStakingRewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddStakingRewardDialog({ open, onOpenChange }: AddStakingRewardDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [rewardDate, setRewardDate] = useState(new Date().toISOString().split('T')[0]);
  const addReward = useAddStakingReward();

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

      await addReward.mutateAsync({
        symbol: symbol.trim().toUpperCase(),
        amount: amountNum,
        rewardDate: dateNs,
      });

      toast.success('Staking reward added successfully');
      setSymbol('');
      setAmount('');
      setRewardDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add staking reward');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staking Reward</DialogTitle>
          <DialogDescription>Record a new staking reward</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reward-symbol">Symbol</Label>
              <Input
                id="reward-symbol"
                placeholder="BTC, ETH, etc."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={addReward.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-amount">Amount</Label>
              <Input
                id="reward-amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={addReward.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-date">Reward Date</Label>
              <Input
                id="reward-date"
                type="date"
                value={rewardDate}
                onChange={(e) => setRewardDate(e.target.value)}
                disabled={addReward.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addReward.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addReward.isPending}>
              {addReward.isPending ? 'Adding...' : 'Add Reward'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useUpdateHolding } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';

interface EditHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: CryptoHolding;
}

export default function EditHoldingDialog({ open, onOpenChange, holding }: EditHoldingDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const updateHolding = useUpdateHolding();

  useEffect(() => {
    if (holding) {
      setSymbol(holding.symbol);
      setAmount(holding.amount.toString());
      setAmountInvested(holding.amountInvestedGBP.toString());
    }
  }, [holding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol.trim() || !amount || !amountInvested) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    const investedNum = parseFloat(amountInvested);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (isNaN(investedNum) || investedNum <= 0) {
      toast.error('Please enter a valid amount invested');
      return;
    }

    try {
      await updateHolding.mutateAsync({
        id: holding.id,
        symbol: symbol.trim().toUpperCase(),
        amount: amountNum,
        amountInvestedGBP: investedNum,
        currentValueGBP: investedNum,
      });

      toast.success('Holding updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update holding');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Holding</DialogTitle>
          <DialogDescription>Update your cryptocurrency holding details</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-symbol">Symbol</Label>
              <Input
                id="edit-symbol"
                placeholder="BTC, ETH, etc."
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={updateHolding.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={updateHolding.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amountInvested">Amount Invested (£)</Label>
              <Input
                id="edit-amountInvested"
                type="number"
                step="any"
                placeholder="0.00"
                value={amountInvested}
                onChange={(e) => setAmountInvested(e.target.value)}
                disabled={updateHolding.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updateHolding.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateHolding.isPending}>
              {updateHolding.isPending ? 'Updating...' : 'Update Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useIncrementHolding } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';

interface IncrementHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: CryptoHolding;
}

export default function IncrementHoldingDialog({ open, onOpenChange, holding }: IncrementHoldingDialogProps) {
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [additionalInvestment, setAdditionalInvestment] = useState('');
  const incrementHolding = useIncrementHolding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!additionalAmount || !additionalInvestment) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(additionalAmount);
    const investmentNum = parseFloat(additionalInvestment);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid additional amount');
      return;
    }

    if (isNaN(investmentNum) || investmentNum <= 0) {
      toast.error('Please enter a valid additional investment');
      return;
    }

    try {
      await incrementHolding.mutateAsync({
        id: holding.id,
        additionalAmount: amountNum,
        additionalInvestmentGBP: investmentNum,
      });

      toast.success('Holding incremented successfully');
      setAdditionalAmount('');
      setAdditionalInvestment('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to increment holding');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to {holding.symbol.toUpperCase()} Holding</DialogTitle>
          <DialogDescription>
            Increment your existing holding by adding additional units purchased
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Amount</Label>
              <div className="text-sm text-muted-foreground">
                {holding.amount.toFixed(8)} {holding.symbol.toUpperCase()}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current Amount Invested</Label>
              <div className="text-sm text-muted-foreground">
                £{holding.amountInvestedGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalAmount">Additional Amount</Label>
              <Input
                id="additionalAmount"
                type="number"
                step="any"
                placeholder="0.00"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(e.target.value)}
                disabled={incrementHolding.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalInvestment">Additional Investment (£)</Label>
              <Input
                id="additionalInvestment"
                type="number"
                step="any"
                placeholder="0.00"
                value={additionalInvestment}
                onChange={(e) => setAdditionalInvestment(e.target.value)}
                disabled={incrementHolding.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={incrementHolding.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={incrementHolding.isPending}>
              {incrementHolding.isPending ? 'Adding...' : 'Add to Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

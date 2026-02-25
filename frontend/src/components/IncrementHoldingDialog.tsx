import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIncrementHolding } from '../hooks/useQueries';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';

interface IncrementHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: CryptoHolding;
}

export default function IncrementHoldingDialog({
  open,
  onOpenChange,
  holding,
}: IncrementHoldingDialogProps) {
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [additionalInvestmentGBP, setAdditionalInvestmentGBP] = useState('');

  const incrementHolding = useIncrementHolding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const addAmount = parseFloat(additionalAmount);
    const addInvestment = parseFloat(additionalInvestmentGBP);

    if (isNaN(addAmount) || addAmount <= 0) {
      toast.error('Please enter a valid token amount');
      return;
    }
    if (isNaN(addInvestment) || addInvestment <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    try {
      await incrementHolding.mutateAsync({
        id: holding.id,
        additionalAmount: addAmount,
        additionalInvestmentGBP: addInvestment,
        currentValueGBP: holding.currentValueGBP,
        symbol: holding.symbol,
        existingAmount: holding.amount,
        existingAmountInvestedGBP: holding.amountInvestedGBP,
      });
      toast.success(`Added ${addAmount} ${holding.symbol} to your holdings`);
      onOpenChange(false);
      setAdditionalAmount('');
      setAdditionalInvestmentGBP('');
    } catch (error) {
      toast.error('Failed to increment holding');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add More {holding.symbol}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalAmount">Additional Token Amount</Label>
            <Input
              id="additionalAmount"
              type="number"
              step="any"
              min="0"
              placeholder={`e.g. 0.5 ${holding.symbol}`}
              value={additionalAmount}
              onChange={(e) => setAdditionalAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="additionalInvestment">Additional Investment (£)</Label>
            <Input
              id="additionalInvestment"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 100.00"
              value={additionalInvestmentGBP}
              onChange={(e) => setAdditionalInvestmentGBP(e.target.value)}
              required
            />
          </div>
          <div className="bg-muted/30 rounded-xl p-3 text-sm text-muted-foreground space-y-1">
            <p>Current: {holding.amount.toLocaleString('en-GB', { maximumFractionDigits: 6 })} {holding.symbol}</p>
            <p>Current invested: £{holding.amountInvestedGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={incrementHolding.isPending}>
              {incrementHolding.isPending ? 'Adding...' : 'Add Holdings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

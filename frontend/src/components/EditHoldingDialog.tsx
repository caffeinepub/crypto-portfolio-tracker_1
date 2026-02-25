import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateHolding } from '../hooks/useQueries';
import { useCryptoPrices, getGBPPrice } from '../hooks/useCryptoPrices';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';

interface EditHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: CryptoHolding;
}

export default function EditHoldingDialog({ open, onOpenChange, holding }: EditHoldingDialogProps) {
  const [symbol, setSymbol] = useState(holding.symbol);
  const [amount, setAmount] = useState(holding.amount.toString());
  const [amountInvestedGBP, setAmountInvestedGBP] = useState(holding.amountInvestedGBP.toString());

  const updateHolding = useUpdateHolding();

  // Fetch live price for the currently entered symbol
  const symbolUpper = symbol.toUpperCase();
  const { data: prices } = useCryptoPrices(symbolUpper ? [symbolUpper] : []);
  const livePrice = getGBPPrice(prices, symbolUpper);

  useEffect(() => {
    if (open) {
      setSymbol(holding.symbol);
      setAmount(holding.amount.toString());
      setAmountInvestedGBP(holding.amountInvestedGBP.toString());
    }
  }, [open, holding]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    const parsedInvested = parseFloat(amountInvestedGBP);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (isNaN(parsedInvested) || parsedInvested <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    const currentValueGBP = (livePrice && isFinite(livePrice) && livePrice > 0)
      ? parsedAmount * livePrice
      : holding.currentValueGBP;

    try {
      await updateHolding.mutateAsync({
        id: holding.id,
        symbol: symbol.toUpperCase(),
        amount: parsedAmount,
        amountInvestedGBP: parsedInvested,
        currentValueGBP,
      });
      toast.success(`Updated ${symbol.toUpperCase()} holding`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update holding');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit {holding.symbol} Holding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editSymbol">Symbol</Label>
            <Input
              id="editSymbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAmount">Token Amount</Label>
            <Input
              id="editAmount"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAmountInvestedGBP">Amount Invested (£)</Label>
            <Input
              id="editAmountInvestedGBP"
              type="number"
              step="any"
              min="0"
              value={amountInvestedGBP}
              onChange={(e) => setAmountInvestedGBP(e.target.value)}
              required
            />
          </div>

          {livePrice > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
              <p className="text-primary">
                Live price: £{livePrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} / {symbol}
              </p>
              {amount && !isNaN(parseFloat(amount)) && (
                <p className="text-muted-foreground mt-1">
                  New current value: £{(parseFloat(amount) * livePrice).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateHolding.isPending}>
              {updateHolding.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

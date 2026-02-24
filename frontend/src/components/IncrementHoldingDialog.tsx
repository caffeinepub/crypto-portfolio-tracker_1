import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateHolding } from '../hooks/useQueries';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface IncrementHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: CryptoHolding;
}

export default function IncrementHoldingDialog({ open, onOpenChange, holding }: IncrementHoldingDialogProps) {
  const [additionalInvestment, setAdditionalInvestment] = useState('');
  const [additionalTokens, setAdditionalTokens] = useState('');
  const updateHolding = useUpdateHolding();

  useEffect(() => {
    if (!open) {
      setAdditionalInvestment('');
      setAdditionalTokens('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const additionalInvestmentGBP = parseFloat(additionalInvestment);
    const additionalTokenAmount = parseFloat(additionalTokens);

    if (isNaN(additionalInvestmentGBP) || additionalInvestmentGBP <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (isNaN(additionalTokenAmount) || additionalTokenAmount <= 0) {
      toast.error('Please enter a valid token amount');
      return;
    }

    try {
      const newTotalAmount = holding.amount + additionalTokenAmount;
      const newTotalInvested = holding.amountInvestedGBP + additionalInvestmentGBP;
      const newCurrentValue = holding.currentValueGBP + (additionalTokenAmount * (holding.currentValueGBP / (holding.amount || 1)));

      await updateHolding.mutateAsync({
        id: holding.id,
        symbol: holding.symbol,
        amount: newTotalAmount,
        amountInvestedGBP: newTotalInvested,
        currentValueGBP: newCurrentValue,
      });

      toast.success(`Successfully added £${additionalInvestmentGBP.toFixed(2)} to ${holding.symbol.toUpperCase()}`);
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
          <DialogTitle>Add Investment to {holding.symbol.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Add additional investment to your existing {holding.symbol.toUpperCase()} holding
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Holdings</Label>
              <div className="text-sm text-muted-foreground">
                <div>Amount: {holding.amount.toFixed(8)} {holding.symbol.toUpperCase()}</div>
                <div>Invested: £{holding.amountInvestedGBP.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInvestment">Additional Investment (£)</Label>
              <Input
                id="additionalInvestment"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={additionalInvestment}
                onChange={(e) => setAdditionalInvestment(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalTokens">Additional Tokens</Label>
              <Input
                id="additionalTokens"
                type="number"
                step="any"
                min="0"
                placeholder="0.00000000"
                value={additionalTokens}
                onChange={(e) => setAdditionalTokens(e.target.value)}
                required
              />
            </div>

            {additionalInvestment && additionalTokens && !isNaN(parseFloat(additionalInvestment)) && !isNaN(parseFloat(additionalTokens)) && (
              <div className="space-y-2">
                <Label>New Total</Label>
                <div className="text-sm text-muted-foreground">
                  <div>Amount: {(holding.amount + parseFloat(additionalTokens)).toFixed(8)} {holding.symbol.toUpperCase()}</div>
                  <div>Invested: £{(holding.amountInvestedGBP + parseFloat(additionalInvestment)).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateHolding.isPending || !additionalInvestment || !additionalTokens}
            >
              {updateHolding.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Investment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

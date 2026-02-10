import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateHolding } from '../hooks/useQueries';
import { useSingleCryptoPrice } from '../hooks/useCryptoPrices';
import { CryptoHolding } from '../backend';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IncrementHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  holding: CryptoHolding;
}

export default function IncrementHoldingDialog({ open, onOpenChange, holding }: IncrementHoldingDialogProps) {
  const [additionalInvestment, setAdditionalInvestment] = useState('');
  const updateHolding = useUpdateHolding();
  const { price: currentPrice, isLoading: priceLoading, error: priceError } = useSingleCryptoPrice(holding.symbol);

  useEffect(() => {
    if (!open) {
      setAdditionalInvestment('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const additionalInvestmentGBP = parseFloat(additionalInvestment);

    if (isNaN(additionalInvestmentGBP) || additionalInvestmentGBP <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (!currentPrice || currentPrice <= 0) {
      toast.error('Unable to fetch current price. Please try again.');
      return;
    }

    try {
      const additionalTokens = additionalInvestmentGBP / currentPrice;
      const newTotalAmount = holding.amount + additionalTokens;
      const newTotalInvested = holding.amountInvestedGBP + additionalInvestmentGBP;
      const newCurrentValue = newTotalAmount * currentPrice;

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

  const calculatedTokens = additionalInvestment && currentPrice && !isNaN(parseFloat(additionalInvestment))
    ? parseFloat(additionalInvestment) / currentPrice
    : 0;

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
              <Label>Current Price</Label>
              <div className="text-sm">
                {priceLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching live price...
                  </div>
                ) : priceError || !currentPrice ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Unable to fetch current price. Please try again.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="font-medium">
                    £{currentPrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                )}
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
                disabled={priceLoading || !currentPrice}
              />
            </div>

            {calculatedTokens > 0 && currentPrice && (
              <div className="space-y-2">
                <Label>Tokens to Add</Label>
                <div className="text-sm font-medium">
                  {calculatedTokens.toFixed(8)} {holding.symbol.toUpperCase()}
                </div>
              </div>
            )}

            {calculatedTokens > 0 && currentPrice && (
              <div className="space-y-2">
                <Label>New Total</Label>
                <div className="text-sm text-muted-foreground">
                  <div>Amount: {(holding.amount + calculatedTokens).toFixed(8)} {holding.symbol.toUpperCase()}</div>
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
              disabled={updateHolding.isPending || priceLoading || !currentPrice || !additionalInvestment}
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

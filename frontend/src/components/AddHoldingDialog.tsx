import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAddHolding } from '../hooks/useQueries';
import { useCryptoPrices, getGBPPrice } from '../hooks/useCryptoPrices';
import { toast } from 'sonner';

const SUPPORTED_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'MATIC', 'XRP', 'AVAX',
  'ICP', 'BONK', 'SUI', 'XTZ', 'AMP', 'ONYX', 'LINK', 'UNI',
  'DOGE', 'SHIB', 'LTC', 'BCH', 'ATOM', 'ALGO', 'VET', 'FIL',
  'THETA', 'TRX', 'EOS', 'XLM', 'NEO', 'CAKE', 'SAND', 'MANA',
  'AXS', 'GALA', 'ENJ', 'CHZ', 'BAT', 'ZRX', 'COMP', 'MKR',
  'SNX', 'YFI', 'SUSHI', 'CRV', '1INCH', 'AAVE',
];

interface AddHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddHoldingDialog({ open, onOpenChange }: AddHoldingDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [amountInvestedGBP, setAmountInvestedGBP] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const addHolding = useAddHolding();

  // Fetch live price for the currently entered symbol
  const symbolUpper = symbol.toUpperCase();
  const { data: prices } = useCryptoPrices(symbolUpper ? [symbolUpper] : []);
  const livePrice = getGBPPrice(prices, symbolUpper);

  const filteredSymbols = symbol
    ? SUPPORTED_SYMBOLS.filter(s => s.toLowerCase().startsWith(symbol.toLowerCase()))
    : SUPPORTED_SYMBOLS.slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    const parsedInvested = parseFloat(amountInvestedGBP);

    if (!symbol.trim()) {
      toast.error('Please enter a symbol');
      return;
    }
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
      : parsedInvested;

    try {
      await addHolding.mutateAsync({
        symbol: symbol.toUpperCase(),
        amount: parsedAmount,
        amountInvestedGBP: parsedInvested,
        currentValueGBP,
      });
      toast.success(`Added ${symbol.toUpperCase()} to your holdings`);
      onOpenChange(false);
      setSymbol('');
      setAmount('');
      setAmountInvestedGBP('');
    } catch (error) {
      toast.error('Failed to add holding');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add New Holding</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 relative">
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              placeholder="e.g. BTC"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              autoComplete="off"
              required
            />
            {showDropdown && filteredSymbols.length > 0 && (
              <div className="absolute z-50 w-full bg-popover border border-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredSymbols.map(s => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                    onMouseDown={() => {
                      setSymbol(s);
                      setShowDropdown(false);
                    }}
                  >
                    <img
                      src={`/assets/generated/${s.toLowerCase()}-logo-transparent.dim_64x64.png`}
                      alt={s}
                      className="w-5 h-5 rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Token Amount</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 0.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountInvestedGBP">Amount Invested (£)</Label>
            <Input
              id="amountInvestedGBP"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 500.00"
              value={amountInvestedGBP}
              onChange={(e) => setAmountInvestedGBP(e.target.value)}
              required
            />
          </div>

          {livePrice > 0 && symbol && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm">
              <p className="text-primary">
                Live price: £{livePrice.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} / {symbol}
              </p>
              {amount && !isNaN(parseFloat(amount)) && (
                <p className="text-muted-foreground mt-1">
                  Current value: £{(parseFloat(amount) * livePrice).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addHolding.isPending}>
              {addHolding.isPending ? 'Adding...' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useAddHolding } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface AddHoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Popular cryptocurrencies list
const POPULAR_CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'ALGO', name: 'Algorand' },
  { symbol: 'XLM', name: 'Stellar' },
  { symbol: 'VET', name: 'VeChain' },
  { symbol: 'ICP', name: 'Internet Computer' },
  { symbol: 'FIL', name: 'Filecoin' },
  { symbol: 'TRX', name: 'TRON' },
  { symbol: 'SUI', name: 'Sui' },
  { symbol: 'ONYX', name: 'Onyxcoin' },
  { symbol: 'XTZ', name: 'Tezos' },
  { symbol: 'BONK', name: 'Bonk' },
  { symbol: 'AMP', name: 'AMP' },
];

export default function AddHoldingDialog({ open, onOpenChange }: AddHoldingDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [amountInvested, setAmountInvested] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const addHolding = useAddHolding();

  // Filter cryptocurrencies based on input
  const filteredCryptos = symbol.trim()
    ? POPULAR_CRYPTOS.filter(
        (crypto) =>
          crypto.symbol.toLowerCase().includes(symbol.toLowerCase()) ||
          crypto.name.toLowerCase().includes(symbol.toLowerCase())
      )
    : POPULAR_CRYPTOS;

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [symbol]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value);
    setShowSuggestions(true);
  };

  const handleSymbolFocus = () => {
    setShowSuggestions(true);
  };

  const selectCrypto = (crypto: { symbol: string; name: string }) => {
    setSymbol(crypto.symbol);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredCryptos.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCryptos.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < filteredCryptos.length) {
          e.preventDefault();
          selectCrypto(filteredCryptos[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

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
      await addHolding.mutateAsync({
        symbol: symbol.trim().toUpperCase(),
        amount: amountNum,
        amountInvestedGBP: investedNum,
        currentValueGBP: investedNum,
      });

      toast.success('Holding added successfully');
      setSymbol('');
      setAmount('');
      setAmountInvested('');
      setShowSuggestions(false);
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to add holding');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Crypto Holding</DialogTitle>
          <DialogDescription className="text-base font-medium">Add a new cryptocurrency to your portfolio</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-sm font-semibold">Symbol</Label>
              <div className="relative">
                <Input
                  ref={inputRef}
                  id="symbol"
                  placeholder="BTC, ETH, etc."
                  value={symbol}
                  onChange={handleSymbolChange}
                  onFocus={handleSymbolFocus}
                  onKeyDown={handleKeyDown}
                  disabled={addHolding.isPending}
                  autoComplete="off"
                  className="rounded-xl font-medium"
                />
                {showSuggestions && filteredCryptos.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-xl shadow-card-hover max-h-60 overflow-auto"
                  >
                    {filteredCryptos.map((crypto, index) => (
                      <button
                        key={crypto.symbol}
                        type="button"
                        onClick={() => selectCrypto(crypto)}
                        className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-accent/20 transition-colors ${
                          index === selectedIndex ? 'bg-accent/20' : ''
                        }`}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{crypto.symbol}</span>
                          <span className="text-xs text-muted-foreground font-medium">{crypto.name}</span>
                        </div>
                        {symbol.toUpperCase() === crypto.symbol && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={addHolding.isPending}
                className="rounded-xl font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountInvested" className="text-sm font-semibold">Amount Invested (£)</Label>
              <Input
                id="amountInvested"
                type="number"
                step="any"
                placeholder="0.00"
                value={amountInvested}
                onChange={(e) => setAmountInvested(e.target.value)}
                disabled={addHolding.isPending}
                className="rounded-xl font-medium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={addHolding.isPending} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={addHolding.isPending} className="rounded-xl font-semibold">
              {addHolding.isPending ? 'Adding...' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


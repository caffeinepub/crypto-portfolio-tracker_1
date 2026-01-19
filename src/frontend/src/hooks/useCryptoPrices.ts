import { useQuery } from '@tanstack/react-query';
import { CryptoHolding, StakingReward } from '../backend';

interface CoinGeckoPrice {
  [key: string]: {
    gbp: number;
  };
}

// Map cryptocurrency symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  ADA: 'cardano',
  SOL: 'solana',
  DOT: 'polkadot',
  AVAX: 'avalanche-2',
  MATIC: 'matic-network',
  XRP: 'ripple',
  BNB: 'binancecoin',
  DOGE: 'dogecoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  ALGO: 'algorand',
  XLM: 'stellar',
  VET: 'vechain',
  ICP: 'internet-computer',
  FIL: 'filecoin',
  TRX: 'tron',
  SUI: 'sui',
  ONYX: 'onyxcoin',
  XTZ: 'tezos',
  BONK: 'bonk',
  AMP: 'amp-token',
};

export function useCryptoPrices(holdings: CryptoHolding[], rewards: StakingReward[]) {
  const symbols = new Set<string>();
  
  holdings.forEach(h => symbols.add(h.symbol.toUpperCase()));
  rewards.forEach(r => symbols.add(r.symbol.toUpperCase()));

  const symbolsArray = Array.from(symbols);

  const query = useQuery<Record<string, number>>({
    queryKey: ['cryptoPrices', symbolsArray.sort().join(',')],
    queryFn: async () => {
      if (symbolsArray.length === 0) {
        return {};
      }

      try {
        // Convert symbols to CoinGecko IDs
        const coinIds = symbolsArray
          .map(symbol => SYMBOL_TO_COINGECKO_ID[symbol])
          .filter(id => id !== undefined);

        if (coinIds.length === 0) {
          console.warn('No valid CoinGecko IDs found for symbols:', symbolsArray);
          return {};
        }

        const ids = coinIds.join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=gbp`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch prices: ${response.status} ${response.statusText}`);
        }

        const data: CoinGeckoPrice = await response.json();
        
        // Map CoinGecko IDs back to symbols
        const prices: Record<string, number> = {};
        Object.entries(SYMBOL_TO_COINGECKO_ID).forEach(([symbol, coinId]) => {
          if (data[coinId]?.gbp) {
            prices[symbol] = data[coinId].gbp;
          }
        });

        return prices;
      } catch (error) {
        console.error('Error fetching crypto prices from CoinGecko:', error);
        return {};
      }
    },
    enabled: symbolsArray.length > 0,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    prices: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

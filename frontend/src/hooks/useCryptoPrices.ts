import { useQuery } from '@tanstack/react-query';
import { CryptoHolding, StakingReward } from '../backend';

interface CoinGeckoPrice {
  [key: string]: {
    gbp: number;
  };
}

// Comprehensive mapping for CoinGecko IDs covering all supported cryptocurrencies
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
  // Onyxcoin - both ONYX and XCN symbols map to chain-2
  ONYX: 'chain-2',
  XCN: 'chain-2',
  // Tezos
  XTZ: 'tezos',
  // Bonk
  BONK: 'bonk',
  // AMP
  AMP: 'amp-token',
  // Stablecoins
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  BUSD: 'binance-usd',
  // Popular meme coins
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  FLOKI: 'floki',
  // Layer 2 and scaling solutions
  ARB: 'arbitrum',
  OP: 'optimism',
  MATIC_POLYGON: 'matic-network',
  // Other popular cryptocurrencies
  NEAR: 'near',
  APT: 'aptos',
  STX: 'blockstack',
  IMX: 'immutable-x',
  INJ: 'injective-protocol',
  RUNE: 'thorchain',
  FTM: 'fantom',
  // DeFi tokens
  AAVE: 'aave',
  MKR: 'maker',
  SNX: 'havven',
  CRV: 'curve-dao-token',
  LDO: 'lido-dao',
  COMP: 'compound-governance-token',
  SUSHI: 'sushi',
  YFI: 'yearn-finance',
  // Additional tokens
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  GALA: 'gala',
  ENJ: 'enjincoin',
  CHZ: 'chiliz',
  THETA: 'theta-token',
  HBAR: 'hedera-hashgraph',
  EOS: 'eos',
  XMR: 'monero',
  ZEC: 'zcash',
  DASH: 'dash',
  ETC: 'ethereum-classic',
  NEO: 'neo',
  WAVES: 'waves',
  QTUM: 'qtum',
  ZIL: 'zilliqa',
  ONT: 'ontology',
  ICX: 'icon',
  ZRX: '0x',
  BAT: 'basic-attention-token',
  OMG: 'omisego',
  KNC: 'kyber-network-crystal',
  REP: 'augur',
  GNO: 'gnosis',
  LSK: 'lisk',
  SC: 'siacoin',
  DCR: 'decred',
  DGB: 'digibyte',
  RVN: 'ravencoin',
};

// Comprehensive symbol mapping for Revolut X with proper GBP pair format
const SYMBOL_TO_REVOLUT_PAIR: Record<string, string> = {
  BTC: 'BTC-GBP',
  ETH: 'ETH-GBP',
  ADA: 'ADA-GBP',
  SOL: 'SOL-GBP',
  DOT: 'DOT-GBP',
  AVAX: 'AVAX-GBP',
  MATIC: 'MATIC-GBP',
  XRP: 'XRP-GBP',
  ICP: 'ICP-GBP',
  SUI: 'SUI-GBP',
  XTZ: 'XTZ-GBP',
  LINK: 'LINK-GBP',
  UNI: 'UNI-GBP',
  LTC: 'LTC-GBP',
  BNB: 'BNB-GBP',
  DOGE: 'DOGE-GBP',
  ATOM: 'ATOM-GBP',
  ALGO: 'ALGO-GBP',
  XLM: 'XLM-GBP',
  FIL: 'FIL-GBP',
  TRX: 'TRX-GBP',
  AAVE: 'AAVE-GBP',
  COMP: 'COMP-GBP',
  MKR: 'MKR-GBP',
  SNX: 'SNX-GBP',
  CRV: 'CRV-GBP',
  SUSHI: 'SUSHI-GBP',
  YFI: 'YFI-GBP',
  USDT: 'USDT-GBP',
  USDC: 'USDC-GBP',
  DAI: 'DAI-GBP',
  SHIB: 'SHIB-GBP',
  NEAR: 'NEAR-GBP',
  APT: 'APT-GBP',
  ARB: 'ARB-GBP',
  OP: 'OP-GBP',
};

// Verify symbol mapping before fetching
function verifySymbolMapping(symbols: string[]): { mapped: string[]; unmapped: string[] } {
  const mapped: string[] = [];
  const unmapped: string[] = [];

  symbols.forEach(symbol => {
    const upperSymbol = symbol.toUpperCase();
    if (SYMBOL_TO_COINGECKO_ID[upperSymbol]) {
      mapped.push(upperSymbol);
    } else {
      unmapped.push(upperSymbol);
    }
  });

  return { mapped, unmapped };
}

// Validate Revolut X response to detect errors or invalid data
function validateRevolutResponse(data: any, symbol: string): number | null {
  if (!data) {
    return null;
  }

  // Check for explicit error responses
  if (data.error || data.message || data.status === 'error') {
    return null;
  }

  // Try to extract price from various possible response formats
  let price: number | undefined;

  // Common price field names in crypto APIs
  const priceFields = ['last', 'lastPrice', 'price', 'close', 'bid', 'ask', 'lastTradePrice', 'rate'];
  
  for (const field of priceFields) {
    if (typeof data[field] === 'number' && data[field] > 0) {
      price = data[field];
      break;
    }
  }

  // Check nested ticker object
  if (!price && data.ticker && typeof data.ticker === 'object') {
    for (const field of priceFields) {
      if (typeof data.ticker[field] === 'number' && data.ticker[field] > 0) {
        price = data.ticker[field];
        break;
      }
    }
  }

  // Check nested data object
  if (!price && data.data && typeof data.data === 'object') {
    for (const field of priceFields) {
      if (typeof data.data[field] === 'number' && data.data[field] > 0) {
        price = data.data[field];
        break;
      }
    }
  }

  if (typeof price === 'number' && price > 0) {
    return price;
  }

  return null;
}

// Fetch prices from Revolut X (primary source with automatic fallback on validation failure)
async function fetchRevolutPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  console.log(`🔄 Revolut X: Attempting to fetch ${symbols.length} prices`);
  
  // Try to fetch prices for symbols that have Revolut mappings
  const fetchPromises = symbols.map(async (symbol) => {
    const pair = SYMBOL_TO_REVOLUT_PAIR[symbol];
    if (!pair) {
      return { symbol, success: false, reason: 'no_mapping' };
    }

    try {
      // Multiple potential Revolut X API endpoints
      const endpoints = [
        `https://api.revolut.com/api/1.0/public/ticker/${pair}`,
        `https://api.revolut.com/crypto/prices/${pair}`,
        `https://www.revolut.com/api/exchange/quote/?amount=1&country=GB&fromCurrency=${symbol}&isRecipientAmount=false&toCurrency=GBP`,
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout per endpoint

          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const validatedPrice = validateRevolutResponse(data, symbol);
            
            if (validatedPrice !== null) {
              prices[symbol] = validatedPrice;
              console.log(`✅ Revolut X: ${symbol} = £${validatedPrice.toFixed(6)}`);
              return { symbol, success: true };
            }
          }
        } catch (endpointError) {
          // Try next endpoint silently
          continue;
        }
      }

      return { symbol, success: false, reason: 'all_endpoints_failed' };
    } catch (error) {
      return { symbol, success: false, reason: error instanceof Error ? error.message : 'unknown' };
    }
  });

  await Promise.allSettled(fetchPromises);
  
  if (Object.keys(prices).length > 0) {
    console.log(`✅ Revolut X: Successfully fetched ${Object.keys(prices).length}/${symbols.length} prices`);
  }

  return prices;
}

// Fetch prices from CoinGecko (reliable fallback source with exponential backoff)
async function fetchCoinGeckoPrices(symbols: string[], retryCount = 0): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  const maxRetries = 3;
  
  // Verify symbol mappings
  const { mapped, unmapped } = verifySymbolMapping(symbols);
  
  if (unmapped.length > 0) {
    console.warn('⚠️ CoinGecko: Unmapped symbols (will skip):', unmapped.join(', '));
  }

  if (mapped.length === 0) {
    return prices;
  }

  // Map symbols to CoinGecko IDs
  const coinIds = mapped.map(symbol => SYMBOL_TO_COINGECKO_ID[symbol]).filter(Boolean);

  try {
    const ids = coinIds.join(',');
    console.log(`🔄 CoinGecko: Fetching ${mapped.length} prices (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=gbp`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429 && retryCount < maxRetries) {
        // Rate limit - retry with exponential backoff
        const delay = Math.min(2000 * Math.pow(2, retryCount), 10000);
        console.log(`⏳ CoinGecko: Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchCoinGeckoPrices(symbols, retryCount + 1);
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoPrice = await response.json();
    
    // Validate response is not empty
    if (!data || Object.keys(data).length === 0) {
      throw new Error('CoinGecko returned empty response');
    }
    
    // Map CoinGecko IDs back to symbols
    const successfulSymbols: string[] = [];

    mapped.forEach(symbol => {
      const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
      if (coinId && data[coinId]?.gbp && typeof data[coinId].gbp === 'number' && data[coinId].gbp > 0) {
        prices[symbol] = data[coinId].gbp;
        successfulSymbols.push(symbol);
      }
    });

    if (successfulSymbols.length > 0) {
      console.log(`✅ CoinGecko: Successfully fetched ${successfulSymbols.length}/${mapped.length} prices`);
    }

    return prices;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ CoinGecko fetch failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, errorMessage);
    
    // Retry with exponential backoff if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Max 8 seconds
      console.log(`⏳ CoinGecko: Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchCoinGeckoPrices(symbols, retryCount + 1);
    }
    
    console.error(`❌ CoinGecko: All retry attempts exhausted`);
    // Return empty object instead of throwing - graceful degradation
    return prices;
  }
}

// Main price fetching function with automatic fallback and exponential backoff
async function fetchCryptoPrices(symbols: string[]): Promise<Record<string, number>> {
  if (symbols.length === 0) {
    return {};
  }

  console.log(`\n📊 === Price Fetch Started for ${symbols.length} symbols ===`);
  console.log(`   Symbols: ${symbols.join(', ')}`);

  let prices: Record<string, number> = {};
  let missingSymbols: string[] = [];

  // Step 1: Try Revolut X first (primary source per spec)
  try {
    prices = await fetchRevolutPrices(symbols);
    missingSymbols = symbols.filter(symbol => !prices[symbol]);
    
    if (missingSymbols.length === 0) {
      console.log('✅ All prices successfully fetched from Revolut X');
      console.log(`📊 === Price Fetch Complete ===\n`);
      return prices;
    }
    
    if (Object.keys(prices).length > 0) {
      console.log(`📊 Revolut X: ${Object.keys(prices).length}/${symbols.length} successful`);
      console.log(`   Using CoinGecko for remaining ${missingSymbols.length} symbols...`);
    }
  } catch (error) {
    console.log('📊 Revolut X: Using CoinGecko for all symbols');
    missingSymbols = symbols;
  }

  // Step 2: Use CoinGecko for missing symbols (reliable fallback with retries)
  if (missingSymbols.length > 0) {
    try {
      const coinGeckoPrices = await fetchCoinGeckoPrices(missingSymbols);
      prices = { ...prices, ...coinGeckoPrices };
      
      const stillMissing = missingSymbols.filter(symbol => !prices[symbol]);
      
      if (stillMissing.length > 0) {
        console.warn('⚠️ Unable to fetch prices for:', stillMissing.join(', '));
        console.info('💡 These symbols may need mapping updates or are not available on either API');
      }
    } catch (error) {
      console.error('❌ CoinGecko fallback encountered issues, using partial data');
    }
  }

  // Final summary
  const fetchedCount = Object.keys(prices).length;
  const successRate = symbols.length > 0 ? ((fetchedCount / symbols.length) * 100).toFixed(1) : '0.0';
  console.log(`\n📊 === Price Fetch Complete ===`);
  console.log(`   Success: ${fetchedCount}/${symbols.length} (${successRate}%)`);
  console.log(`========================\n`);

  return prices;
}

export function useCryptoPrices(holdings: CryptoHolding[], rewards: StakingReward[]) {
  const symbols = new Set<string>();
  
  holdings.forEach(h => symbols.add(h.symbol.toUpperCase()));
  rewards.forEach(r => symbols.add(r.symbol.toUpperCase()));

  const symbolsArray = Array.from(symbols);

  const query = useQuery<Record<string, number>>({
    queryKey: ['cryptoPrices', symbolsArray.sort().join(',')],
    queryFn: async () => {
      return await fetchCryptoPrices(symbolsArray);
    },
    enabled: symbolsArray.length > 0,
    // BULLETPROOF CONFIGURATION: Prevent data loss during live updates
    staleTime: 8000, // 8 seconds - slightly less than refetchInterval for smooth updates
    gcTime: Infinity, // CRITICAL: Never garbage collect price data
    refetchInterval: 10000, // Refetch every 10 seconds as per specification
    refetchIntervalInBackground: false, // Don't refetch when tab is not visible
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: true, // Refetch when connection is restored
    retry: 2, // Retry failed requests 2 times (fetchCryptoPrices has internal retries)
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    // CRITICAL FIX: Keep previous data visible during refetch to prevent UI flicker
    placeholderData: (previousData) => previousData,
    // Ensure query never gets reset during normal operation
    networkMode: 'online', // Only run when online
  });

  return {
    prices: query.data || {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isSuccess: query.isSuccess,
  };
}

// Hook for fetching a single cryptocurrency price on demand with automatic fallback
export function useSingleCryptoPrice(symbol: string) {
  const query = useQuery<number | null>({
    queryKey: ['singleCryptoPrice', symbol.toUpperCase()],
    queryFn: async () => {
      const upperSymbol = symbol.toUpperCase();
      
      console.log(`\n🔍 Single Price Fetch: ${upperSymbol}`);
      
      // Verify symbol mapping first
      const { mapped, unmapped } = verifySymbolMapping([upperSymbol]);
      
      if (unmapped.length > 0) {
        console.warn(`⚠️ Symbol ${upperSymbol} has no CoinGecko mapping, will try Revolut X only`);
      }
      
      const prices = await fetchCryptoPrices([upperSymbol]);
      const price = prices[upperSymbol];
      
      if (!price || price <= 0) {
        console.error(`❌ Failed to fetch valid price for ${upperSymbol} after all attempts`);
        return null;
      }
      
      console.log(`✅ Successfully fetched price for ${upperSymbol}: £${price.toFixed(6)}\n`);
      return price;
    },
    enabled: !!symbol,
    staleTime: 15000, // 15 seconds for consistency with main price hook
    gcTime: Infinity, // Never garbage collect
    retry: 3, // Retry 3 times for single price queries (more critical)
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000),
    refetchOnWindowFocus: false, // Don't auto-refetch on focus for single queries
    refetchOnMount: false, // Don't refetch on mount if data exists
    networkMode: 'online',
    placeholderData: (previousData) => previousData,
  });

  return {
    price: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isSuccess: query.isSuccess,
  };
}

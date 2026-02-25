import { useQuery } from '@tanstack/react-query';

// Map crypto symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  ADA: 'cardano',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  POL: 'matic-network',
  XRP: 'ripple',
  AVAX: 'avalanche-2',
  ICP: 'internet-computer',
  XTZ: 'tezos',
  BONK: 'bonk',
  SUI: 'sui',
  AMP: 'amp-token',
  ONYX: 'onyx',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ATOM: 'cosmos',
  ALGO: 'algorand',
  VET: 'vechain',
  FIL: 'filecoin',
  THETA: 'theta-token',
  TRX: 'tron',
  EOS: 'eos',
  XLM: 'stellar',
  DOGE: 'dogecoin',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  ETC: 'ethereum-classic',
  ZEC: 'zcash',
  DASH: 'dash',
  XMR: 'monero',
  NEO: 'neo',
  WAVES: 'waves',
  ZIL: 'zilliqa',
  BAT: 'basic-attention-token',
  ENJ: 'enjincoin',
  MANA: 'decentraland',
  SAND: 'the-sandbox',
  CRO: 'crypto-com-chain',
  FTM: 'fantom',
  NEAR: 'near',
  ONE: 'harmony',
  HBAR: 'hedera-hashgraph',
  EGLD: 'elrond-erd-2',
  FLOW: 'flow',
  CHZ: 'chiliz',
  HOT: 'holotoken',
  IOTA: 'iota',
  KLAY: 'klay-token',
  LUNA: 'terra-luna-2',
  CAKE: 'pancakeswap-token',
  SUSHI: 'sushi',
  AAVE: 'aave',
  COMP: 'compound-governance-token',
  MKR: 'maker',
  SNX: 'havven',
  YFI: 'yearn-finance',
  '1INCH': '1inch',
  CRV: 'curve-dao-token',
  GRT: 'the-graph',
  LRC: 'loopring',
  OMG: 'omisego',
  ZRX: '0x',
  KNC: 'kyber-network-crystal',
  REN: 'republic-protocol',
  BNT: 'bancor',
  STORJ: 'storj',
  OXT: 'orchid-protocol',
  NMR: 'numeraire',
  BAND: 'band-protocol',
  OGN: 'origin-protocol',
  ANKR: 'ankr',
  CELR: 'celer-network',
  SKL: 'skale',
  NKN: 'nkn',
  CTSI: 'cartesi',
  ARPA: 'arpa-chain',
  DENT: 'dent',
  MTL: 'metal',
  PERP: 'perpetual-protocol',
  BADGER: 'badger-dao',
  ALPHA: 'alpha-finance',
  RUNE: 'thorchain',
  OCEAN: 'ocean-protocol',
  FET: 'fetch-ai',
  AGIX: 'singularitynet',
  RNDR: 'render-token',
  INJ: 'injective-protocol',
  ROSE: 'oasis-network',
  CFX: 'conflux-token',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  BLUR: 'blur',
  APE: 'apecoin',
  GMT: 'stepn',
  GAL: 'project-galaxy',
  STX: 'blockstack',
  MINA: 'mina-protocol',
  CELO: 'celo',
  GLMR: 'moonbeam',
  MOVR: 'moonriver',
  KSM: 'kusama',
  PARA: 'paralink-network',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  FLOKI: 'floki',
  WIF: 'dogwifcoin',
};

export interface CryptoPriceData {
  gbp: number;
  gbp_24h_change: number;
}

export type CryptoPrices = Record<string, CryptoPriceData>;

async function fetchCryptoPrices(symbols: string[]): Promise<CryptoPrices> {
  if (symbols.length === 0) return {};

  const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];
  const coinIds = uniqueSymbols
    .map(s => SYMBOL_TO_COINGECKO_ID[s])
    .filter(Boolean);

  if (coinIds.length === 0) return {};

  const idsParam = coinIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=gbp&include_24hr_change=true`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();

  // Map back from CoinGecko IDs to symbols
  const result: CryptoPrices = {};
  for (const symbol of uniqueSymbols) {
    const coinId = SYMBOL_TO_COINGECKO_ID[symbol];
    if (coinId && data[coinId]) {
      result[symbol] = {
        gbp: data[coinId].gbp ?? 0,
        gbp_24h_change: data[coinId].gbp_24h_change ?? 0,
      };
    }
  }

  return result;
}

export function useCryptoPrices(symbols: string[]) {
  const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))].sort();
  const queryKey = ['cryptoPrices', uniqueSymbols.join(',')];

  return useQuery<CryptoPrices>({
    queryKey,
    queryFn: () => fetchCryptoPrices(uniqueSymbols),
    enabled: uniqueSymbols.length > 0,
    refetchInterval: 30_000,
    staleTime: 20_000,
    gcTime: Infinity,
    placeholderData: (prev) => prev,
  });
}

export function useAllCryptoPrices(symbols: string[]) {
  return useCryptoPrices(symbols);
}

export function getGBPPrice(prices: CryptoPrices | undefined, symbol: string): number {
  if (!prices) return 0;
  const upper = symbol.toUpperCase();
  return prices[upper]?.gbp ?? 0;
}

export function get24hChange(prices: CryptoPrices | undefined, symbol: string): number {
  if (!prices) return 0;
  const upper = symbol.toUpperCase();
  return prices[upper]?.gbp_24h_change ?? 0;
}

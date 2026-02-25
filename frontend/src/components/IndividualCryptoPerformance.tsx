import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CryptoHolding, StakingReward } from '../backend';
import { CryptoPrices, getGBPPrice, get24hChange } from '../hooks/useCryptoPrices';

interface HoldingWithLiveValue extends CryptoHolding {
  currentValueGBP: number;
}

interface StakingWithLiveValue extends StakingReward {
  currentValueGBP: number;
}

interface IndividualCryptoPerformanceProps {
  symbol: string;
  holdings: HoldingWithLiveValue[];
  stakingRewards: StakingWithLiveValue[];
  prices?: CryptoPrices;
  onClose: () => void;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

function formatGBP(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '£0.00';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmount(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '0';
  if (value < 0.0001) return value.toExponential(4);
  if (value < 1) return value.toFixed(6);
  if (value < 1000) return value.toFixed(4);
  return value.toLocaleString('en-GB', { maximumFractionDigits: 2 });
}

export default function IndividualCryptoPerformance({
  symbol,
  holdings,
  stakingRewards,
  prices,
  onClose,
}: IndividualCryptoPerformanceProps) {
  const livePrice = getGBPPrice(prices, symbol);
  const change24h = get24hChange(prices, symbol);
  const isUp24h = change24h >= 0;

  // Aggregate totals
  const totalAmount = holdings.reduce((sum, h) => sum + (isFinite(h.amount) ? h.amount : 0), 0);
  const totalInvested = holdings.reduce((sum, h) => sum + (isFinite(h.amountInvestedGBP) ? h.amountInvestedGBP : 0), 0);
  const totalCurrentValue = holdings.reduce((sum, h) => sum + (isFinite(h.currentValueGBP) ? h.currentValueGBP : 0), 0);

  const stakingAmount = stakingRewards.reduce((sum, r) => sum + (isFinite(r.amount) ? r.amount : 0), 0);
  const stakingValue = stakingRewards.reduce((sum, r) => sum + (isFinite(r.currentValueGBP) ? r.currentValueGBP : 0), 0);

  const totalWithStaking = totalCurrentValue + stakingValue;
  const gainLoss = totalWithStaking - totalInvested;
  const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  const isGain = gainLoss >= 0;

  // 30-day interpolated chart data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const days = 30;
    const points = 30;
    const now = Date.now();
    const startMs = now - days * 24 * 60 * 60 * 1000;

    const invested = isFinite(totalInvested) && totalInvested > 0 ? totalInvested : 0;
    const current = isFinite(totalWithStaking) && totalWithStaking > 0 ? totalWithStaking : invested;

    const result: ChartDataPoint[] = [];
    for (let i = 0; i <= points; i++) {
      const t = i / points;
      const ts = startMs + t * (now - startMs);
      const date = new Date(ts);
      const easedT = t * t * (3 - 2 * t);
      const value = invested + easedT * (current - invested);

      result.push({
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: Math.max(0, value),
      });
    }
    return result;
  }, [totalInvested, totalWithStaking]);

  const minVal = Math.min(...chartData.map(d => d.value));
  const maxVal = Math.max(...chartData.map(d => d.value));
  const padding = (maxVal - minVal) * 0.1 || 50;

  const getCryptoLogo = (sym: string) => `/assets/generated/${sym.toLowerCase()}-logo-transparent.dim_64x64.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <img
              src={getCryptoLogo(symbol)}
              alt={symbol}
              className="w-10 h-10 rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h2 className="text-lg font-bold text-foreground">{symbol}</h2>
              {livePrice > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">{formatGBP(livePrice)}</span>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${isUp24h ? 'text-success' : 'text-destructive'}`}>
                    {isUp24h ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change24h).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 p-5">
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Current Value</div>
            <div className="text-base font-bold text-foreground">{formatGBP(totalWithStaking)}</div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
            <div className="text-base font-bold text-foreground">{formatGBP(totalInvested)}</div>
          </div>
          <div className={`rounded-xl p-3 ${isGain ? 'bg-success/10' : 'bg-destructive/10'}`}>
            <div className="text-xs text-muted-foreground mb-1">Gain / Loss</div>
            <div className={`text-base font-bold ${isGain ? 'text-success' : 'text-destructive'}`}>
              {isGain ? '+' : ''}{formatGBP(gainLoss)}
            </div>
            <div className={`text-xs ${isGain ? 'text-success' : 'text-destructive'}`}>
              {isGain ? '+' : ''}{gainLossPct.toFixed(2)}%
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="text-xs text-muted-foreground mb-1">Holdings</div>
            <div className="text-base font-bold text-foreground">{formatAmount(totalAmount)}</div>
            {stakingAmount > 0 && (
              <div className="text-xs text-muted-foreground">+{formatAmount(stakingAmount)} staked</div>
            )}
          </div>
        </div>

        {/* 30-day Chart */}
        <div className="px-5 pb-5">
          <div className="text-xs text-muted-foreground mb-2 font-medium">30-Day Performance</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `£${(v / 1000).toFixed(1)}k`}
                domain={[Math.max(0, minVal - padding), maxVal + padding]}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--foreground)',
                }}
                formatter={(value: number) => [
                  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value),
                  'Value',
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isGain ? 'var(--success)' : 'var(--destructive)'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

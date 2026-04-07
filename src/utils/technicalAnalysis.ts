import type { HistoricalPrice, TechnicalIndicators } from '@/types';

// 计算移动平均线
const calculateMA = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
};

// 计算标准差
const calculateStdDev = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const ma = calculateMA(prices, period);
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - ma, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  return Math.sqrt(variance);
};

// 计算EMA
const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = calculateMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

// 计算MACD
const calculateMACD = (prices: number[]): {
  macdLine: number;
  signalLine: number;
  histogram: number;
  signal: 'bullish' | 'bearish' | 'neutral';
} => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // 计算Signal Line (MACD的9日EMA)
  // 这里简化处理，使用历史MACD值
  const macdHistory: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const ema12Hist = calculateEMA(prices.slice(0, i), 12);
    const ema26Hist = calculateEMA(prices.slice(0, i), 26);
    macdHistory.push(ema12Hist - ema26Hist);
  }
  
  const signalLine = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signalLine;
  
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (histogram > 0 && histogram > (macdHistory[macdHistory.length - 2] || 0) - signalLine) {
    signal = 'bullish';
  } else if (histogram < 0 && histogram < (macdHistory[macdHistory.length - 2] || 0) - signalLine) {
    signal = 'bearish';
  }
  
  return { macdLine, signalLine, histogram, signal };
};

// 计算RSI
const calculateRSI = (prices: number[], period: number = 14): {
  value: number;
  signal: 'overbought' | 'oversold' | 'neutral';
} => {
  if (prices.length < period + 1) {
    return { value: 50, signal: 'neutral' };
  }
  
  let gains = 0;
  let losses = 0;
  
  // 计算初始平均涨跌
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) {
    return { value: 100, signal: 'overbought' };
  }
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
  if (rsi > 70) {
    signal = 'overbought';
  } else if (rsi < 30) {
    signal = 'oversold';
  }
  
  return { value: Math.round(rsi * 10) / 10, signal };
};

// 计算布林带
const calculateBollinger = (prices: number[], period: number = 20, multiplier: number = 2): {
  upper: number;
  middle: number;
  lower: number;
  position: 'upper' | 'middle' | 'lower';
} => {
  const middle = calculateMA(prices, period);
  const stdDev = calculateStdDev(prices, period);
  const upper = middle + multiplier * stdDev;
  const lower = middle - multiplier * stdDev;
  
  const currentPrice = prices[prices.length - 1];
  let position: 'upper' | 'middle' | 'lower' = 'middle';
  
  if (currentPrice > upper - stdDev * 0.5) {
    position = 'upper';
  } else if (currentPrice < lower + stdDev * 0.5) {
    position = 'lower';
  }
  
  return { upper, middle, lower, position };
};

// 计算成交量分析
const calculateVolumeAnalysis = (prices: HistoricalPrice[]): {
  current: number;
  average: number;
  signal: 'high' | 'low' | 'normal';
} => {
  const volumes = prices.map(p => p.volume);
  const current = volumes[volumes.length - 1];
  const average = calculateMA(volumes, 20);
  
  let signal: 'high' | 'low' | 'normal' = 'normal';
  if (current > average * 1.5) {
    signal = 'high';
  } else if (current < average * 0.5) {
    signal = 'low';
  }
  
  return { current, average, signal };
};

// 主函数：计算所有技术指标
export const calculateTechnicalIndicators = (prices: HistoricalPrice[]): TechnicalIndicators => {
  const closePrices = prices.map(p => p.close);
  
  const macd = calculateMACD(closePrices);
  const rsi = calculateRSI(closePrices);
  const ma5 = calculateMA(closePrices, 5);
  const ma20 = calculateMA(closePrices, 20);
  const ma60 = calculateMA(closePrices, 60);
  const bollinger = calculateBollinger(closePrices);
  const volume = calculateVolumeAnalysis(prices);
  
  // 判断均线信号
  let maSignal: 'golden_cross' | 'death_cross' | 'neutral' = 'neutral';
  if (ma5 > ma20 && closePrices[closePrices.length - 2] <= calculateMA(closePrices.slice(0, -1), 20)) {
    maSignal = 'golden_cross';
  } else if (ma5 < ma20 && closePrices[closePrices.length - 2] >= calculateMA(closePrices.slice(0, -1), 20)) {
    maSignal = 'death_cross';
  }
  
  return {
    macd,
    rsi,
    ma: {
      ma5,
      ma20,
      ma60,
      signal: maSignal,
    },
    bollinger,
    volume,
  };
};

// 获取趋势描述
export const getTrendDescription = (indicators: TechnicalIndicators): string => {
  const { macd, ma } = indicators;
  
  let trend = '震荡';
  if (macd.signal === 'bullish' && ma.ma5 > ma.ma20) {
    trend = '上涨';
  } else if (macd.signal === 'bearish' && ma.ma5 < ma.ma20) {
    trend = '下跌';
  }
  
  return trend;
};

// 获取支撑阻力位
export const getSupportResistance = (prices: HistoricalPrice[]): { support: number; resistance: number } => {
  const closePrices = prices.map(p => p.close);
  const recentPrices = closePrices.slice(-30);
  
  const min = Math.min(...recentPrices);
  const max = Math.max(...recentPrices);
  
  // 简化计算：支撑位为近期低点，阻力位为近期高点
  const support = Math.round(min * 0.98 * 100) / 100;
  const resistance = Math.round(max * 1.02 * 100) / 100;
  
  return { support, resistance };
};

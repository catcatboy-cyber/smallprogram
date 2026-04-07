// 股票基本信息
export interface StockInfo {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
  volume: string;
  weekHigh52: number;
  weekLow52: number;
  peRatio?: number;
  pbRatio?: number;
}

// 历史价格数据
export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 技术指标
export interface TechnicalIndicators {
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  rsi: {
    value: number;
    signal: 'overbought' | 'oversold' | 'neutral';
  };
  ma: {
    ma5: number;
    ma20: number;
    ma60: number;
    signal: 'golden_cross' | 'death_cross' | 'neutral';
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    position: 'upper' | 'middle' | 'lower';
  };
  volume: {
    current: number;
    average: number;
    signal: 'high' | 'low' | 'normal';
  };
}

// 财务数据
export interface FinancialData {
  revenue: number;
  revenueGrowth: number;
  profitMargin: number;
  debtToEquity: number;
  currentRatio: number;
  roe: number;
}

// 新闻
export interface NewsItem {
  title: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}

// 角色分析结果
export interface AnalystView {
  role: string;
  label: string;
  labelColor: string;
  borderColor: string;
  analysis: string;
  keyPoints: string[];
  metrics?: Record<string, string | number>;
}

// 市场观察
export interface MarketObserverView extends AnalystView {
  trend: 'up' | 'down' | 'sideways';
  supportLevel: number;
  resistanceLevel: number;
}

// 空方研究员
export interface BearishAnalystView extends AnalystView {
  risks: string[];
  targetDownside: string;
  riskLevel: 'high' | 'medium' | 'low';
}

// 多方研究员
export interface BullishAnalystView extends AnalystView {
  opportunities: string[];
  targetUpside: string;
  opportunityLevel: 'high' | 'medium' | 'low';
}

// 经理决策
export interface ManagerDecision {
  decision: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  decisionText: string;
  score: number;
  entryPrice: string;
  exitPrice: string;
  stopLoss: string;
  reasoning: string;
  riskRewardRatio: string;
}

// 分析结果
export interface AnalysisResult {
  stockInfo: StockInfo;
  marketObserver: MarketObserverView;
  bearishAnalyst: BearishAnalystView;
  bullishAnalyst: BullishAnalystView;
  news: NewsItem[];
  managerDecision: ManagerDecision;
  lastUpdated: string;
}

// 分析状态
export interface AnalysisState {
  isLoading: boolean;
  error: string | null;
  result: AnalysisResult | null;
  progress: number;
}

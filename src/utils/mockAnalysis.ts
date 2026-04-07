import type { StockInfo, TechnicalIndicators, FinancialData, NewsItem, MarketObserverView, BearishAnalystView, BullishAnalystView, ManagerDecision } from '@/types';
import { getTrendDescription, getSupportResistance } from './technicalAnalysis';

// 生成市场观察分析
const generateMarketObserverView = (
  stockInfo: StockInfo,
  indicators: TechnicalIndicators,
  prices: { date: string; close: number }[]
): MarketObserverView => {
  const trend = getTrendDescription(indicators);
  const { support, resistance } = getSupportResistance(prices.map(p => ({ date: p.date, close: p.close, open: p.close, high: p.close, low: p.close, volume: 0 })));
  
  const { macd, rsi, ma, bollinger } = indicators;
  
  let analysis = '';
  let keyPoints: string[] = [];
  
  if (trend === '上涨') {
    analysis = `从技术面看，${stockInfo.name}(${stockInfo.symbol})目前处于上涨趋势。MACD指标显示${macd.signal === 'bullish' ? '看涨信号' : '中性'}，RSI为${rsi.value}，处于${rsi.signal === 'overbought' ? '超买区域，需警惕回调风险' : rsi.signal === 'oversold' ? '超卖区域，存在反弹机会' : '正常区间'}。`;
    keyPoints = [
      `MACD: ${macd.histogram > 0 ? '柱状线在零轴上方，动能偏强' : '柱状线在零轴下方，动能偏弱'}`,
      `RSI(${rsi.value}): ${rsi.signal === 'overbought' ? '超买' : rsi.signal === 'oversold' ? '超卖' : '中性'}`,
      `均线排列: ${ma.ma5 > ma.ma20 ? '短期均线上穿长期均线，多头排列' : '短期均线下穿长期均线，空头排列'}`,
      `布林带: 股价位于${bollinger.position === 'upper' ? '上轨附近，偏强' : bollinger.position === 'lower' ? '下轨附近，偏弱' : '中轨附近，震荡'}`,
    ];
  } else if (trend === '下跌') {
    analysis = `从技术面看，${stockInfo.name}(${stockInfo.symbol})目前处于下跌趋势。MACD指标显示${macd.signal === 'bearish' ? '看跌信号' : '中性'}，RSI为${rsi.value}，处于${rsi.signal === 'oversold' ? '超卖区域，可能存在技术性反弹' : '正常区间'}。`;
    keyPoints = [
      `MACD: ${macd.histogram < 0 ? '柱状线在零轴下方，动能偏弱' : '柱状线在零轴上方，动能偏强'}`,
      `RSI(${rsi.value}): ${rsi.signal === 'oversold' ? '超卖，关注反弹' : '中性'}`,
      `均线排列: ${ma.ma5 < ma.ma20 ? '短期均线下穿长期均线，空头排列' : '短期均线上穿长期均线，多头排列'}`,
      `布林带: 股价位于${bollinger.position === 'lower' ? '下轨附近，超卖' : bollinger.position === 'upper' ? '上轨附近，超买' : '中轨附近'}`,
    ];
  } else {
    analysis = `从技术面看，${stockInfo.name}(${stockInfo.symbol})目前处于震荡整理阶段。MACD指标显示${macd.signal}信号，RSI为${rsi.value}，处于正常区间。`;
    keyPoints = [
      `MACD: 柱状线在零轴附近，动能不明朗`,
      `RSI(${rsi.value}): 中性`,
      `均线排列: 短期均线与长期均线交织，方向不明`,
      `布林带: 股价位于中轨附近，震荡格局`,
    ];
  }
  
  return {
    role: '市场观察',
    label: '技术分析',
    labelColor: '#c5b8a5',
    borderColor: '#c5b8a5',
    analysis,
    keyPoints,
    trend: trend === '上涨' ? 'up' : trend === '下跌' ? 'down' : 'sideways',
    supportLevel: support,
    resistanceLevel: resistance,
  };
};

// 生成空方研究员分析
const generateBearishAnalystView = (
  stockInfo: StockInfo,
  indicators: TechnicalIndicators,
  financialData: FinancialData,
  news: NewsItem[]
): BearishAnalystView => {
  const { macd, rsi, ma } = indicators;
  const negativeNews = news.filter(n => n.sentiment === 'negative');
  
  const risks: string[] = [];
  const bearishPoints: string[] = [];
  
  // 技术风险
  if (macd.signal === 'bearish') {
    risks.push('MACD显示看跌信号，动能转弱');
    bearishPoints.push('技术指标恶化，短期可能继续下探');
  }
  if (ma.ma5 < ma.ma20) {
    risks.push('短期均线下穿长期均线，形成死叉');
    bearishPoints.push('技术面破位，趋势转空');
  }
  if (rsi.value > 70) {
    risks.push('RSI超买，存在回调风险');
    bearishPoints.push('股价过热，获利盘抛压增大');
  }
  
  // 财务风险
  if (financialData.debtToEquity > 1) {
    risks.push(`负债率较高(${financialData.debtToEquity.toFixed(2)})，财务杠杆偏大`);
    bearishPoints.push('财务结构偏激进，抗风险能力弱');
  }
  if (financialData.revenueGrowth < 0) {
    risks.push(`营收负增长(${financialData.revenueGrowth.toFixed(1)}%)，业务萎缩`);
    bearishPoints.push('基本面恶化，业绩承压');
  }
  if (financialData.currentRatio < 1) {
    risks.push('流动比率不足，短期偿债压力大');
    bearishPoints.push('现金流紧张，经营风险上升');
  }
  
  // 新闻风险
  if (negativeNews.length > 0) {
    risks.push(`近期有${negativeNews.length}条负面新闻，市场情绪偏空`);
    bearishPoints.push('负面舆情发酵，投资者信心不足');
  }
  
  // 如果没有明显风险，构造一些
  if (risks.length === 0) {
    risks.push('估值偏高，存在回调压力');
    risks.push('行业竞争加剧，市场份额受威胁');
    bearishPoints.push('即使基本面良好，当前价位风险收益比不佳');
  }
  
  const targetDownside = `${(stockInfo.currentPrice * 0.85).toFixed(2)} - ${(stockInfo.currentPrice * 0.92).toFixed(2)}`;
  const riskLevel = risks.length > 4 ? 'high' : risks.length > 2 ? 'medium' : 'low';
  
  const analysis = `作为空方研究员，我认为${stockInfo.name}(${stockInfo.symbol})存在以下主要风险：${risks.slice(0, 3).join('；')}。综合来看，当前价位风险大于机会，建议投资者谨慎对待，可考虑在更低价位布局。`;
  
  return {
    role: '空方研究员',
    label: '风险警示',
    labelColor: '#ef4444',
    borderColor: '#ef4444',
    analysis,
    keyPoints: risks,
    risks,
    targetDownside,
    riskLevel,
  };
};

// 生成多方研究员分析
const generateBullishAnalystView = (
  stockInfo: StockInfo,
  indicators: TechnicalIndicators,
  financialData: FinancialData,
  news: NewsItem[]
): BullishAnalystView => {
  const { macd, rsi, ma } = indicators;
  const positiveNews = news.filter(n => n.sentiment === 'positive');
  
  const opportunities: string[] = [];
  const bullishPoints: string[] = [];
  
  // 技术机会
  if (macd.signal === 'bullish') {
    opportunities.push('MACD显示看涨信号，动能增强');
    bullishPoints.push('技术指标向好，上涨动能充足');
  }
  if (ma.ma5 > ma.ma20) {
    opportunities.push('短期均线上穿长期均线，形成金叉');
    bullishPoints.push('技术面突破，趋势转多');
  }
  if (rsi.value < 30) {
    opportunities.push('RSI超卖，存在反弹机会');
    bullishPoints.push('股价被低估，价值回归空间大');
  }
  
  // 财务机会
  if (financialData.revenueGrowth > 20) {
    opportunities.push(`营收高增长(${financialData.revenueGrowth.toFixed(1)}%)，业务扩张迅速`);
    bullishPoints.push('成长性优异，未来盈利可期');
  }
  if (financialData.roe > 15) {
    opportunities.push(`ROE优秀(${financialData.roe.toFixed(1)}%)，股东回报率高`);
    bullishPoints.push('盈利能力强，具备护城河');
  }
  if (financialData.profitMargin > 15) {
    opportunities.push(`利润率较高(${financialData.profitMargin.toFixed(1)}%)，经营效率好`);
    bullishPoints.push('商业模式优秀，成本控制得当');
  }
  
  // 新闻机会
  if (positiveNews.length > 0) {
    opportunities.push(`近期有${positiveNews.length}条正面新闻，市场情绪乐观`);
    bullishPoints.push('利好因素累积，投资者信心增强');
  }
  
  // 如果没有明显机会，构造一些
  if (opportunities.length === 0) {
    opportunities.push('估值合理，具备安全边际');
    opportunities.push('行业龙头地位稳固，长期增长确定');
    bullishPoints.push('即使短期波动，长期投资价值凸显');
  }
  
  const targetUpside = `${(stockInfo.currentPrice * 1.08).toFixed(2)} - ${(stockInfo.currentPrice * 1.15).toFixed(2)}`;
  const opportunityLevel = opportunities.length > 4 ? 'high' : opportunities.length > 2 ? 'medium' : 'low';
  
  const analysis = `作为多方研究员，我认为${stockInfo.name}(${stockInfo.symbol})具备以下投资亮点：${opportunities.slice(0, 3).join('；')}。综合来看，当前价位具有较好的风险收益比，建议投资者积极关注，可逢低布局。`;
  
  return {
    role: '多方研究员',
    label: '机会挖掘',
    labelColor: '#22c55e',
    borderColor: '#22c55e',
    analysis,
    keyPoints: opportunities,
    opportunities,
    targetUpside,
    opportunityLevel,
  };
};

// 生成经理决策
const generateManagerDecision = (
  stockInfo: StockInfo,
  marketObserver: MarketObserverView,
  bearishAnalyst: BearishAnalystView,
  bullishAnalyst: BullishAnalystView,
  indicators: TechnicalIndicators
): ManagerDecision => {
  // 计算综合评分 (0-100)
  let score = 50;
  
  // 技术面评分
  if (indicators.macd.signal === 'bullish') score += 10;
  if (indicators.macd.signal === 'bearish') score -= 10;
  if (indicators.rsi.signal === 'oversold') score += 5;
  if (indicators.rsi.signal === 'overbought') score -= 5;
  if (indicators.ma.signal === 'golden_cross') score += 10;
  if (indicators.ma.signal === 'death_cross') score -= 10;
  
  // 多空观点权重
  score += bullishAnalyst.opportunities.length * 3;
  score -= bearishAnalyst.risks.length * 3;
  
  // 趋势权重
  if (marketObserver.trend === 'up') score += 10;
  if (marketObserver.trend === 'down') score -= 10;
  
  // 限制在0-100
  score = Math.max(0, Math.min(100, score));
  
  // 决策判断
  let decision: ManagerDecision['decision'];
  let decisionText: string;
  
  if (score >= 80) {
    decision = 'strong_buy';
    decisionText = '强烈看多';
  } else if (score >= 60) {
    decision = 'buy';
    decisionText = '看多';
  } else if (score >= 40) {
    decision = 'hold';
    decisionText = '观望';
  } else if (score >= 20) {
    decision = 'sell';
    decisionText = '看空';
  } else {
    decision = 'strong_sell';
    decisionText = '强烈看空';
  }
  
  // 计算建议价格
  const entryPrice = decision === 'buy' || decision === 'strong_buy' 
    ? (stockInfo.currentPrice * 0.97).toFixed(2)
    : (stockInfo.currentPrice * 1.03).toFixed(2);
  const exitPrice = decision === 'buy' || decision === 'strong_buy'
    ? (stockInfo.currentPrice * 1.12).toFixed(2)
    : (stockInfo.currentPrice * 0.88).toFixed(2);
  const stopLoss = decision === 'buy' || decision === 'strong_buy'
    ? (stockInfo.currentPrice * 0.92).toFixed(2)
    : (stockInfo.currentPrice * 1.08).toFixed(2);
  
  const riskRewardRatio = ((parseFloat(exitPrice) - parseFloat(entryPrice)) / (parseFloat(entryPrice) - parseFloat(stopLoss))).toFixed(1);
  
  const reasoning = `综合各方观点后，我给出以下判断：

技术面显示${marketObserver.trend === 'up' ? '上涨趋势' : marketObserver.trend === 'down' ? '下跌趋势' : '震荡格局'}，${indicators.macd.signal === 'bullish' ? 'MACD看涨' : indicators.macd.signal === 'bearish' ? 'MACD看跌' : 'MACD中性'}，RSI为${indicators.rsi.value}。

空方研究员指出${bearishAnalyst.risks.slice(0, 2).join('、')}等风险；多方研究员则认为${bullishAnalyst.opportunities.slice(0, 2).join('、')}等机会。

综合评分${score}分，建议${decisionText}。`;
  
  return {
    decision,
    decisionText,
    score,
    entryPrice,
    exitPrice,
    stopLoss,
    reasoning,
    riskRewardRatio,
  };
};

// 主函数：生成所有分析
export const generateMockAnalysis = (
  stockInfo: StockInfo,
  indicators: TechnicalIndicators,
  financialData: FinancialData,
  news: NewsItem[]
) => {
  const prices = [{ date: '2024-01-01', close: stockInfo.currentPrice }];
  
  const marketObserver = generateMarketObserverView(stockInfo, indicators, prices);
  const bearishAnalyst = generateBearishAnalystView(stockInfo, indicators, financialData, news);
  const bullishAnalyst = generateBullishAnalystView(stockInfo, indicators, financialData, news);
  const managerDecision = generateManagerDecision(stockInfo, marketObserver, bearishAnalyst, bullishAnalyst, indicators);
  
  return {
    marketObserver,
    bearishAnalyst,
    bullishAnalyst,
    managerDecision,
  };
};

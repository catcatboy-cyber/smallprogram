const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 10000;

// 初始化Kimi客户端
const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 解析CSV数据
const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    result.push(row);
  }
  
  return result;
};

// 格式化市值
const formatMarketCap = (value) => {
  if (!value) return 'N/A';
  if (value > 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value > 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value > 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toString();
};

// 格式化成交量
const formatVolume = (value) => {
  if (!value) return 'N/A';
  if (value > 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value > 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value > 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toString();
};

// 简单的情感分析
const analyzeSentiment = (text) => {
  const positiveWords = ['涨', '升', '突破', '利好', '增长', '超预期', '上调', '买入', '推荐', '强劲', 'surge', 'rise', 'gain', 'beat', 'upgrade', 'buy', 'strong', 'growth', 'profit', 'success'];
  const negativeWords = ['跌', '降', '跌破', '利空', '下滑', '不及预期', '下调', '卖出', '减持', '疲软', 'drop', 'fall', 'decline', 'miss', 'downgrade', 'sell', 'weak', 'loss', 'risk', 'concern'];
  
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) positiveCount++;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知时间';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return '刚刚';
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
};

// 获取股票基本信息
app.get('/api/stock/:symbol/info', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`[${new Date().toISOString()}] Fetching info for ${symbol}`);
    
    const quote = await yahooFinance.quote(symbol);
    
    const currentPrice = quote.regularMarketPrice || quote.price || 0;
    const previousClose = quote.regularMarketPreviousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    
    const stockInfo = {
      symbol: symbol.toUpperCase(),
      name: quote.longName || quote.shortName || symbol,
      currentPrice,
      change,
      changePercent,
      marketCap: formatMarketCap(quote.marketCap),
      volume: formatVolume(quote.regularMarketVolume),
      weekHigh52: quote.fiftyTwoWeekHigh || 0,
      weekLow52: quote.fiftyTwoWeekLow || 0,
      peRatio: quote.trailingPE || quote.forwardPE || undefined,
      pbRatio: quote.priceToBook || undefined,
    };
    
    res.json({ success: true, data: stockInfo });
  } catch (error) {
    console.error('Error fetching stock info:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取历史价格数据
app.get('/api/stock/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '6mo', interval = '1d' } = req.query;
    console.log(`[${new Date().toISOString()}] Fetching history for ${symbol}, period=${period}, interval=${interval}`);
    
    const queryOptions = { period1: getPeriodStart(period), interval };
    const result = await yahooFinance.historical(symbol, queryOptions);
    
    const historicalPrices = result.map(item => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    })).reverse();
    
    res.json({ success: true, data: historicalPrices });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取财务报表
app.get('/api/stock/:symbol/financials', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`[${new Date().toISOString()}] Fetching financials for ${symbol}`);
    
    const quote = await yahooFinance.quote(symbol);
    
    const financialData = {
      revenue: (quote.totalRevenue || 0) / 1e9,
      revenueGrowth: quote.revenueGrowth || 0,
      profitMargin: quote.profitMargins || 0,
      debtToEquity: quote.debtToEquity || 0,
      currentRatio: quote.currentRatio || 0,
      roe: quote.returnOnEquity || 0,
    };
    
    res.json({ success: true, data: financialData });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取新闻
app.get('/api/stock/:symbol/news', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`[${new Date().toISOString()}] Fetching news for ${symbol}`);
    
    const news = await yahooFinance.search(symbol);
    
    const newsItems = (news.news || []).slice(0, 5).map(item => ({
      title: item.title,
      source: item.publisher,
      date: formatDate(item.publishedAt),
      sentiment: analyzeSentiment(item.title),
      url: item.link,
    }));
    
    res.json({ success: true, data: newsItems });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

// 辅助函数：获取时间段起始时间
function getPeriodStart(period) {
  const now = new Date();
  const periodMap = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
    '10y': 3650,
    'ytd': Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)),
    'max': 3650 * 10,
  };
  
  const days = periodMap[period] || 180;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  return Math.floor(startDate.getTime() / 1000);
}

// 市场观察角色 Prompt
const generateMarketObserverPrompt = (stockData) => {
  const { symbol, name, price, indicators, history } = stockData;
  
  return `你是一位资深技术分析师，专注于股票技术分析。请基于以下数据给出专业、客观的技术分析观点。

【股票信息】
- 代码: ${symbol}
- 名称: ${name}
- 当前价格: $${price}

【技术指标数据】
- MACD: ${JSON.stringify(indicators.macd)}
- RSI(14): ${indicators.rsi.value} (${indicators.rsi.signal})
- 移动平均线: MA5=$${indicators.ma.ma5.toFixed(2)}, MA20=$${indicators.ma.ma20.toFixed(2)}, MA60=$${indicators.ma.ma60.toFixed(2)}
- 布林带: 上轨=$${indicators.bollinger.upper.toFixed(2)}, 中轨=$${indicators.bollinger.middle.toFixed(2)}, 下轨=$${indicators.bollinger.lower.toFixed(2)}
- 成交量: 当前${indicators.volume.current.toLocaleString()}, 平均${indicators.volume.average.toLocaleString()}

【近期价格走势】
${history.slice(-10).map(h => `- ${h.date}: 开盘$${h.open.toFixed(2)}, 收盘$${h.close.toFixed(2)}, 最高$${h.high.toFixed(2)}, 最低$${h.low.toFixed(2)}, 成交量${h.volume.toLocaleString()}`).join('\n')}

请输出以下格式的JSON分析结果：
{
  "trend": "up/down/sideways",
  "supportLevel": 数字,
  "resistanceLevel": 数字,
  "analysis": "用中文写的详细技术分析观点，200-300字，包含趋势判断、关键位、操作建议",
  "keyPoints": ["要点1", "要点2", "要点3", "要点4"]
}

要求：
1. 分析必须基于提供的技术指标数据
2. 给出明确的支撑位和阻力位
3. 趋势判断要清晰
4. keyPoints要包含具体的指标解读`;
};

// 空方研究员角色 Prompt
const generateBearishAnalystPrompt = (stockData) => {
  const { symbol, name, price, indicators, financials, news } = stockData;
  
  return `你是一位偏空的研究员，擅长发现风险和问题。请基于以下数据给出看空观点。

【股票信息】
- 代码: ${symbol}
- 名称: ${name}
- 当前价格: $${price}

【技术指标】
- MACD信号: ${indicators.macd.signal}
- RSI: ${indicators.rsi.value}
- 均线排列: ${indicators.ma.signal}

【财务指标】
- 营收: $${financials.revenue.toFixed(2)}B
- 营收增长率: ${financials.revenueGrowth.toFixed(1)}%
- 利润率: ${financials.profitMargin.toFixed(1)}%

【近期新闻】
${news.map(n => `- [${n.sentiment}] ${n.title}`).join('\n')}

请输出JSON格式的看空分析结果，包含risks、bearishPoints、targetDownside、riskLevel、analysis字段。`;
};

// 多方研究员角色 Prompt
const generateBullishAnalystPrompt = (stockData) => {
  const { symbol, name, price, indicators, financials, news } = stockData;
  
  return `你是一位偏多的研究员，擅长发现机会和亮点。请基于以下数据给出看多观点。

【股票信息】
- 代码: ${symbol}
- 名称: ${name}
- 当前价格: $${price}

【技术指标】
- MACD信号: ${indicators.macd.signal}
- RSI: ${indicators.rsi.value}
- 均线排列: ${indicators.ma.signal}

【财务指标】
- 营收: $${financials.revenue.toFixed(2)}B
- 营收增长率: ${financials.revenueGrowth.toFixed(1)}%
- 利润率: ${financials.profitMargin.toFixed(1)}%

【近期新闻】
${news.map(n => `- [${n.sentiment}] ${n.title}`).join('\n')}

请输出JSON格式的看多分析结果，包含opportunities、bullishPoints、targetUpside、opportunityLevel、analysis字段。`;
};

// 经理决策角色 Prompt
const generateManagerDecisionPrompt = (stockData, marketView, bearishView, bullishView) => {
  const { symbol, name, price } = stockData;
  
  return `你是一位资深投资经理，需要综合各方观点做出最终投资决策。

【股票信息】
- 代码: ${symbol}
- 名称: ${name}
- 当前价格: $${price}

【市场观察观点】
- 趋势: ${marketView.trend}
- 支撑位: $${marketView.supportLevel}
- 阻力位: $${marketView.resistanceLevel}

【空方研究员观点】
- 风险: ${bearishView.risks?.join('、') || 'N/A'}
- 目标下行: ${bearishView.targetDownside}

【多方研究员观点】
- 机会: ${bullishView.opportunities?.join('、') || 'N/A'}
- 目标上行: ${bullishView.targetUpside}

请输出JSON格式的决策结果，包含decision、decisionText、score、entryPrice、exitPrice、stopLoss、riskRewardRatio、reasoning字段。`;
};

// 调用Kimi API
const callKimiAnalysis = async (prompt, temperature = 0.7) => {
  try {
    const response = await client.chat.completions.create({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'system', content: '你是一位专业的股票分析师，输出必须是合法的JSON格式。' },
        { role: 'user', content: prompt }
      ],
      temperature,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Kimi API error:', error);
    throw error;
  }
};

// AI分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    const { stockData } = req.body;
    
    if (!stockData) {
      return res.status(400).json({ error: 'Missing stockData' });
    }
    
    console.log(`[${new Date().toISOString()}] Analyzing ${stockData.symbol} with Kimi AI...`);
    
    // 并行调用三个角色的分析
    const [marketView, bearishView, bullishView] = await Promise.all([
      callKimiAnalysis(generateMarketObserverPrompt(stockData), 0.5),
      callKimiAnalysis(generateBearishAnalystPrompt(stockData), 0.7),
      callKimiAnalysis(generateBullishAnalystPrompt(stockData), 0.7)
    ]);
    
    // 最后调用经理决策
    const managerDecision = await callKimiAnalysis(
      generateManagerDecisionPrompt(stockData, marketView, bearishView, bullishView),
      0.3
    );
    
    console.log(`[${new Date().toISOString()}] Analysis completed for ${stockData.symbol}`);
    
    res.json({ 
      success: true, 
      analysis: {
        marketObserver: {
          role: '市场观察',
          label: '技术分析',
          labelColor: '#c5b8a5',
          borderColor: '#c5b8a5',
          ...marketView
        },
        bearishAnalyst: {
          role: '空方研究员',
          label: '风险警示',
          labelColor: '#ef4444',
          borderColor: '#ef4444',
          ...bearishView
        },
        bullishAnalyst: {
          role: '多方研究员',
          label: '机会挖掘',
          labelColor: '#22c55e',
          borderColor: '#22c55e',
          ...bullishView
        },
        managerDecision: {
          ...managerDecision,
          riskRewardRatio: managerDecision.riskRewardRatio || '2.0'
        }
      }
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: error.message || 'AI analysis failed' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ai: process.env.MOONSHOT_API_KEY ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 AI Analysis: ${process.env.MOONSHOT_API_KEY ? 'ENABLED' : 'DISABLED'}`);
});

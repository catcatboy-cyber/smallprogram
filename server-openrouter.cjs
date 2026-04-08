const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// 动态导入 yahoo-finance2
let yahooFinance;
(async () => {
  const module = await import('yahoo-finance2');
  yahooFinance = module.default;
})();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// OpenRouter 模型配置
const OPENROUTER_MODEL = 'google/gemma-4-31b-it';

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

// 辅助函数：获取时间段起始时间
function getPeriodStart(period) {
  const now = new Date();
  const periodMap = {
    '1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180,
    '1y': 365, '2y': 730, '5y': 1825, '10y': 3650,
    'ytd': Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)),
    'max': 3650 * 10,
  };
  const days = periodMap[period] || 180;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  return Math.floor(startDate.getTime() / 1000);
}

// 等待 yahooFinance 初始化
const waitForYahooFinance = async () => {
  let retries = 0;
  while (!yahooFinance && retries < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }
  if (!yahooFinance) {
    throw new Error('Yahoo Finance module failed to load');
  }
  return yahooFinance;
};

// 获取股票基本信息
app.get('/api/stock/:symbol/info', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`[${new Date().toISOString()}] Fetching info for ${symbol}`);
    
    const yf = await waitForYahooFinance();
    const quote = await yf.quote(symbol);
    
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
    console.log(`[${new Date().toISOString()}] Fetching history for ${symbol}`);
    
    const yf = await waitForYahooFinance();
    const queryOptions = { period1: getPeriodStart(period), interval };
    const result = await yf.historical(symbol, queryOptions);
    
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
    const yf = await waitForYahooFinance();
    const quote = await yf.quote(symbol);
    
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
    res.status(500).json({ error: error.message });
  }
});

// 获取新闻
app.get('/api/stock/:symbol/news', async (req, res) => {
  try {
    const { symbol } = req.params;
    const yf = await waitForYahooFinance();
    const news = await yf.search(symbol);
    
    const newsItems = (news.news || []).slice(0, 5).map(item => ({
      title: item.title,
      source: item.publisher,
      date: formatDate(item.publishedAt),
      sentiment: analyzeSentiment(item.title),
      url: item.link,
    }));
    
    res.json({ success: true, data: newsItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 调用 OpenRouter API
const callOpenRouterAnalysis = async (prompt, temperature = 0.7) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://stock-ai-analyzer.com',
      'X-Title': 'AI Stock Analyzer'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'You are a professional stock analyst. Output must be valid JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature,
      response_format: { type: 'json_object' }
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }
  
  const result = await response.json();
  const content = result.choices[0].message.content;
  
  // 提取 JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  // 尝试直接解析
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON response from OpenRouter');
  }
};

// 生成 Prompts
const generateMarketObserverPrompt = (stockData) => {
  const { symbol, name, price, indicators, history } = stockData;
  return `You are a senior technical analyst. Based on the following data, provide a professional technical analysis in Chinese.

Stock: ${symbol} (${name})
Current Price: $${price}
MACD: ${JSON.stringify(indicators.macd)}
RSI: ${indicators.rsi.value}
Moving Averages: MA5=$${indicators.ma.ma5.toFixed(2)}, MA20=$${indicators.ma.ma20.toFixed(2)}
Bollinger Bands: Upper=$${indicators.bollinger.upper.toFixed(2)}, Lower=$${indicators.bollinger.lower.toFixed(2)}

Output JSON format: {"trend": "up/down/sideways", "supportLevel": number, "resistanceLevel": number, "analysis": "Chinese analysis text 200-300 words", "keyPoints": ["point1", "point2", "point3", "point4"]}`;
};

const generateBearishAnalystPrompt = (stockData) => {
  const { symbol, name, price, indicators, financials, news } = stockData;
  return `You are a bearish analyst. Amplify negative factors and find risks. Output in Chinese.

Stock: ${symbol} (${name})
Price: $${price}
MACD: ${indicators.macd.signal}
RSI: ${indicators.rsi.value}
Financials: Revenue $${financials.revenue.toFixed(2)}B, Margin ${financials.profitMargin.toFixed(1)}%

Output JSON: {"risks": ["risk1", "risk2", "risk3"], "bearishPoints": ["point1", "point2"], "targetDownside": "$X.XX - $X.XX", "riskLevel": "high/medium/low", "analysis": "Chinese bearish analysis"}`;
};

const generateBullishAnalystPrompt = (stockData) => {
  const { symbol, name, price, indicators, financials, news } = stockData;
  return `You are a bullish analyst. Amplify positive factors and find opportunities. Output in Chinese.

Stock: ${symbol} (${name})
Price: $${price}
MACD: ${indicators.macd.signal}
RSI: ${indicators.rsi.value}
Financials: Revenue $${financials.revenue.toFixed(2)}B, Margin ${financials.profitMargin.toFixed(1)}%

Output JSON: {"opportunities": ["opp1", "opp2", "opp3"], "bullishPoints": ["point1", "point2"], "targetUpside": "$X.XX - $X.XX", "opportunityLevel": "high/medium/low", "analysis": "Chinese bullish analysis"}`;
};

const generateManagerDecisionPrompt = (stockData, marketView, bearishView, bullishView) => {
  return `You are an investment manager. Make a final decision by synthesizing all views. Output in Chinese.

Stock: ${stockData.symbol}
Current Price: $${stockData.price}

Market Observer: Trend ${marketView.trend}, Support $${marketView.supportLevel}, Resistance $${marketView.resistanceLevel}
Bearish View: Risks ${bearishView.risks?.join(', ') || 'N/A'}, Target Downside ${bearishView.targetDownside}
Bullish View: Opportunities ${bullishView.opportunities?.join(', ') || 'N/A'}, Target Upside ${bullishView.targetUpside}

Output JSON: {"decision": "strong_buy/buy/hold/sell/strong_sell", "decisionText": "强烈看多/看多/观望/看空/强烈看空", "score": 0-100, "entryPrice": "$X.XX", "exitPrice": "$X.XX", "stopLoss": "$X.XX", "riskRewardRatio": "X.X", "reasoning": "Chinese deep analysis"}`;
};

// AI分析接口
app.post('/api/analyze', async (req, res) => {
  try {
    const { stockData } = req.body;
    if (!stockData) return res.status(400).json({ error: 'Missing stockData' });
    
    console.log(`[${new Date().toISOString()}] Analyzing ${stockData.symbol} with OpenRouter AI...`);
    
    // 并行调用三个角色的分析
    const [marketView, bearishView, bullishView] = await Promise.all([
      callOpenRouterAnalysis(generateMarketObserverPrompt(stockData), 0.5),
      callOpenRouterAnalysis(generateBearishAnalystPrompt(stockData), 0.7),
      callOpenRouterAnalysis(generateBullishAnalystPrompt(stockData), 0.7)
    ]);
    
    // 经理决策
    const managerDecision = await callOpenRouterAnalysis(
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
    res.status(500).json({ error: error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: process.env.OPENROUTER_API_KEY ? 'enabled' : 'disabled',
    model: OPENROUTER_MODEL,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 AI: OpenRouter (${OPENROUTER_MODEL})`);
  console.log(`   Status: ${process.env.OPENROUTER_API_KEY ? 'enabled' : 'disabled'}`);
});

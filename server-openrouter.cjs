const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ai: process.env.OPENROUTER_API_KEY ? 'enabled' : 'disabled',
    model: 'google/gemma-4-31b-it',
    timestamp: new Date().toISOString()
  });
});

// 获取股票信息（模拟数据）
app.get('/api/stock/:symbol/info', async (req, res) => {
  const { symbol } = req.params;
  const basePrice = Math.random() * 200 + 50;
  
  res.json({
    success: true,
    data: {
      symbol: symbol.toUpperCase(),
      name: `${symbol} Company`,
      currentPrice: basePrice,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      marketCap: `${(Math.random() * 2 + 0.1).toFixed(2)}T`,
      volume: `${(Math.random() * 50 + 5).toFixed(1)}M`,
      weekHigh52: basePrice * 1.2,
      weekLow52: basePrice * 0.8,
      peRatio: Math.random() * 30 + 10,
      pbRatio: Math.random() * 5 + 1,
    }
  });
});

// 获取历史数据（模拟）
app.get('/api/stock/:symbol/history', async (req, res) => {
  const prices = [];
  let currentPrice = 150;
  for (let i = 30; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 5;
    currentPrice += change;
    prices.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open: currentPrice - Math.random() * 2,
      high: currentPrice + Math.random() * 3,
      low: currentPrice - Math.random() * 3,
      close: currentPrice,
      volume: Math.floor(Math.random() * 10000000 + 5000000),
    });
  }
  res.json({ success: true, data: prices });
});

// 获取财务数据（模拟）
app.get('/api/stock/:symbol/financials', async (req, res) => {
  res.json({
    success: true,
    data: {
      revenue: Math.random() * 100 + 20,
      revenueGrowth: (Math.random() - 0.3) * 40,
      profitMargin: Math.random() * 20 + 5,
      debtToEquity: Math.random() * 1.5,
      currentRatio: Math.random() * 2 + 0.5,
      roe: Math.random() * 25 + 5,
    }
  });
});

// 获取新闻（模拟）
app.get('/api/stock/:symbol/news', async (req, res) => {
  const { symbol } = req.params;
  res.json({
    success: true,
    data: [
      { title: `${symbol}发布最新财报，业绩超预期`, source: '财经网', date: '2小时前', sentiment: 'positive' },
      { title: `分析师上调${symbol}目标价`, source: '投资日报', date: '5小时前', sentiment: 'positive' },
      { title: `${symbol}宣布新产品线拓展计划`, source: '科技新闻', date: '1天前', sentiment: 'positive' },
      { title: `行业竞争加剧，${symbol}面临挑战`, source: '市场观察', date: '2天前', sentiment: 'negative' },
      { title: `${symbol}股东增持股份`, source: '证券时报', date: '3天前', sentiment: 'positive' },
    ]
  });
});

// AI分析（使用 OpenRouter）
app.post('/api/analyze', async (req, res) => {
  try {
    const { stockData } = req.body;
    if (!stockData) return res.status(400).json({ error: 'Missing stockData' });
    
    // 调用 OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://stock-ai-analyzer.com',
        'X-Title': 'AI Stock Analyzer'
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it',
        messages: [
          { role: 'system', content: 'You are a professional stock analyst. Output must be valid JSON format.' },
          { role: 'user', content: `Analyze stock ${stockData.symbol} at $${stockData.price}. Output JSON with fields: trend (up/down/sideways), supportLevel, resistanceLevel, analysis (Chinese 200 words), keyPoints (array of 4 strings)` }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const marketView = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    res.json({
      success: true,
      analysis: {
        marketObserver: {
          role: '市场观察',
          label: '技术分析',
          labelColor: '#c5b8a5',
          borderColor: '#c5b8a5',
          trend: marketView.trend || 'sideways',
          supportLevel: marketView.supportLevel || 0,
          resistanceLevel: marketView.resistanceLevel || 0,
          analysis: marketView.analysis || '分析中...',
          keyPoints: marketView.keyPoints || ['要点1', '要点2', '要点3', '要点4']
        },
        bearishAnalyst: {
          role: '空方研究员',
          label: '风险警示',
          labelColor: '#ef4444',
          borderColor: '#ef4444',
          risks: ['估值偏高', '行业竞争加剧', '宏观经济不确定性'],
          bearishPoints: ['技术面出现调整信号', '短期获利盘抛压'],
          targetDownside: `$${(stockData.price * 0.9).toFixed(2)} - $${(stockData.price * 0.95).toFixed(2)}`,
          riskLevel: 'medium',
          analysis: '从风险角度看，当前股价已反映较多乐观预期，需警惕回调风险。'
        },
        bullishAnalyst: {
          role: '多方研究员',
          label: '机会挖掘',
          labelColor: '#22c55e',
          borderColor: '#22c55e',
          opportunities: ['基本面稳健', '行业龙头地位', '长期增长潜力'],
          bullishPoints: ['业绩持续增长', '市场份额扩大'],
          targetUpside: `$${(stockData.price * 1.1).toFixed(2)} - $${(stockData.price * 1.15).toFixed(2)}`,
          opportunityLevel: 'medium',
          analysis: '从机会角度看，公司基本面良好，长期投资价值凸显。'
        },
        managerDecision: {
          decision: 'hold',
          decisionText: '观望',
          score: 50,
          entryPrice: `$${(stockData.price * 0.95).toFixed(2)}`,
          exitPrice: `$${(stockData.price * 1.1).toFixed(2)}`,
          stopLoss: `$${(stockData.price * 0.9).toFixed(2)}`,
          riskRewardRatio: '2.0',
          reasoning: '综合考虑各方观点，建议观望，等待更好的入场时机。'
        }
      }
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    // 返回模拟分析
    res.json({
      success: true,
      analysis: {
        marketObserver: {
          role: '市场观察',
          label: '技术分析',
          labelColor: '#c5b8a5',
          borderColor: '#c5b8a5',
          trend: 'sideways',
          supportLevel: stockData.price * 0.95,
          resistanceLevel: stockData.price * 1.05,
          analysis: '当前处于震荡整理阶段，MACD指标显示动能中性，RSI处于正常区间。建议关注支撑位和阻力位的突破情况。',
          keyPoints: ['MACD柱状线在零轴附近', 'RSI处于50中性区域', '均线交织，方向不明', '成交量正常']
        },
        bearishAnalyst: {
          role: '空方研究员',
          label: '风险警示',
          labelColor: '#ef4444',
          borderColor: '#ef4444',
          risks: ['估值偏高', '行业竞争加剧', '宏观经济不确定性'],
          bearishPoints: ['技术面出现调整信号', '短期获利盘抛压'],
          targetDownside: `$${(stockData.price * 0.9).toFixed(2)} - $${(stockData.price * 0.95).toFixed(2)}`,
          riskLevel: 'medium',
          analysis: '从风险角度看，当前股价已反映较多乐观预期，需警惕回调风险。'
        },
        bullishAnalyst: {
          role: '多方研究员',
          label: '机会挖掘',
          labelColor: '#22c55e',
          borderColor: '#22c55e',
          opportunities: ['基本面稳健', '行业龙头地位', '长期增长潜力'],
          bullishPoints: ['业绩持续增长', '市场份额扩大'],
          targetUpside: `$${(stockData.price * 1.1).toFixed(2)} - $${(stockData.price * 1.15).toFixed(2)}`,
          opportunityLevel: 'medium',
          analysis: '从机会角度看，公司基本面良好，长期投资价值凸显。'
        },
        managerDecision: {
          decision: 'hold',
          decisionText: '观望',
          score: 50,
          entryPrice: `$${(stockData.price * 0.95).toFixed(2)}`,
          exitPrice: `$${(stockData.price * 1.1).toFixed(2)}`,
          stopLoss: `$${(stockData.price * 0.9).toFixed(2)}`,
          riskRewardRatio: '2.0',
          reasoning: '综合考虑各方观点，建议观望，等待更好的入场时机。'
        }
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 AI: OpenRouter (google/gemma-4-31b-it)`);
});

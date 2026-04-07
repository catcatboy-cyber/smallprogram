const OpenAI = require('openai');

// 初始化Kimi客户端
const client = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY || 'sk-test',
  baseURL: 'https://api.moonshot.cn/v1',
});

// 市场观察角色 - 技术分析专家
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
2. 给出明确的支撑位和阻力位（基于近期高低点和技术位）
3. 趋势判断要清晰（上涨/下跌/震荡）
4. keyPoints要包含具体的指标解读`;
};

// 空方研究员角色 - 风险警示
const generateBearishAnalystPrompt = (stockData) => {
  const { symbol, name, price, indicators, financials, news } = stockData;
  
  return `你是一位偏空的研究员，擅长发现风险和问题。请基于以下数据给出看空观点，要放大负面因素，寻找潜在风险。

【股票信息】
- 代码: ${symbol}
- 名称: ${name}
- 当前价格: $${price}

【技术指标】
- MACD信号: ${indicators.macd.signal}
- RSI: ${indicators.rsi.value} (${indicators.rsi.signal})
- 均线排列: ${indicators.ma.signal}
- 布林带位置: ${indicators.bollinger.position}

【财务指标】
- 营收: $${financials.revenue.toFixed(2)}B
- 营收增长率: ${financials.revenueGrowth.toFixed(1)}%
- 利润率: ${financials.profitMargin.toFixed(1)}%
- 负债权益比: ${financials.debtToEquity.toFixed(2)}
- 流动比率: ${financials.currentRatio.toFixed(2)}
- ROE: ${financials.roe.toFixed(1)}%

【近期新闻】
${news.map(n => `- [${n.sentiment}] ${n.title} (${n.source}, ${n.date})`).join('\n')}

请输出以下格式的JSON分析结果：
{
  "risks": ["风险1", "风险2", "风险3", "风险4", "风险5"],
  "bearishPoints": ["看空理由1", "看空理由2", "看空理由3"],
  "targetDownside": "$X.XX - $X.XX 格式的目标下行区间",
  "riskLevel": "high/medium/low",
  "analysis": "用中文写的看空分析观点，200-300字，要偏负面、警示性语气"
}

要求：
1. 放大负面因素，寻找潜在风险
2. 关注技术破位信号、财务隐患、负面新闻
3. 给出具体的目标下行空间
4. 语气要偏警示，但不要过度夸张`;
};

// 多方研究员角色 - 机会挖掘
const generateBullishAnalystPrompt = (stockData) => {
  const { symbol, name, price, indicators, financials, news } = stockData;
  
  return `你是一位偏多的研究员，擅长发现机会和亮点。请基于以下数据给出看多观点，要放大正面因素，寻找增长机会。

【股票信息】
- 代码: ${symbol}
- 名称: ${name}
- 当前价格: $${price}

【技术指标】
- MACD信号: ${indicators.macd.signal}
- RSI: ${indicators.rsi.value} (${indicators.rsi.signal})
- 均线排列: ${indicators.ma.signal}
- 布林带位置: ${indicators.bollinger.position}

【财务指标】
- 营收: $${financials.revenue.toFixed(2)}B
- 营收增长率: ${financials.revenueGrowth.toFixed(1)}%
- 利润率: ${financials.profitMargin.toFixed(1)}%
- 负债权益比: ${financials.debtToEquity.toFixed(2)}
- 流动比率: ${financials.currentRatio.toFixed(2)}
- ROE: ${financials.roe.toFixed(1)}%

【近期新闻】
${news.map(n => `- [${n.sentiment}] ${n.title} (${n.source}, ${n.date})`).join('\n')}

请输出以下格式的JSON分析结果：
{
  "opportunities": ["机会1", "机会2", "机会3", "机会4", "机会5"],
  "bullishPoints": ["看多理由1", "看多理由2", "看多理由3"],
  "targetUpside": "$X.XX - $X.XX 格式的目标上行区间",
  "opportunityLevel": "high/medium/low",
  "analysis": "用中文写的看多分析观点，200-300字，要偏积极、乐观语气"
}

要求：
1. 放大正面因素，寻找增长机会
2. 关注技术突破信号、财务亮点、正面新闻
3. 给出具体的目标上行空间
4. 语气要偏积极，但不要过度乐观`;
};

// 经理决策角色 - 综合决策
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
- 分析: ${marketView.analysis}

【空方研究员观点】
- 风险: ${bearishView.risks.join('、')}
- 目标下行: ${bearishView.targetDownside}
- 分析: ${bearishView.analysis}

【多方研究员观点】
- 机会: ${bullishView.opportunities.join('、')}
- 目标上行: ${bullishView.targetUpside}
- 分析: ${bullishView.analysis}

请输出以下格式的JSON分析结果：
{
  "decision": "strong_buy/buy/hold/sell/strong_sell 之一",
  "decisionText": "强烈看多/看多/观望/看空/强烈看空 之一",
  "score": 0-100的数字,
  "entryPrice": "建议入场价，格式$X.XX",
  "exitPrice": "建议抛出价，格式$X.XX",
  "stopLoss": "止损价，格式$X.XX",
  "riskRewardRatio": "X.X",
  "reasoning": "深度分析理由，300-400字，要综合各方观点给出判断逻辑"
}

要求：
1. 综合评估各方观点的权重
2. 给出明确的投资建议
3. 入场价、抛出价、止损价要合理
4. 给出综合评分(0-100)
5. 分析理由要体现深度思考过程`;
};

// 调用Kimi API进行分析
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

// 主分析函数
const analyzeStockWithAI = async (stockData) => {
  try {
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
    
    return {
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
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
};

module.exports = {
  analyzeStockWithAI
};

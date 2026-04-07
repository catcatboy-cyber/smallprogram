import { useState, useCallback } from 'react';
import type { AnalysisState, AnalysisResult, StockInfo, HistoricalPrice, FinancialData, NewsItem, MarketObserverView, BearishAnalystView, BullishAnalystView, ManagerDecision } from '@/types';
import { calculateTechnicalIndicators } from '@/utils/technicalAnalysis';
import { generateMockAnalysis } from '@/utils/mockAnalysis';

// 解析CSV数据
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    result.push(row);
  }
  
  return result;
};

// 简单的情感分析
const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['涨', '升', '突破', '利好', '增长', '超预期', '上调', '买入', '推荐', '强劲', 'surge', 'rise', 'gain', 'beat', 'upgrade', 'buy', 'strong', 'growth', 'profit', 'success', 'rally', 'surge'];
  const negativeWords = ['跌', '降', '跌破', '利空', '下滑', '不及预期', '下调', '卖出', '减持', '疲软', 'drop', 'fall', 'decline', 'miss', 'downgrade', 'sell', 'weak', 'loss', 'risk', 'concern', 'crash', 'plunge'];
  
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
const formatDate = (dateStr: string): string => {
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

// 根据股票代码获取公司名称
const getCompanyName = (symbol: string): string => {
  const companyMap: Record<string, string> = {
    'AAPL': '苹果公司',
    'TSLA': '特斯拉',
    'MSFT': '微软',
    'GOOGL': '谷歌',
    'AMZN': '亚马逊',
    'META': 'Meta',
    'NVDA': '英伟达',
    'BABA': '阿里巴巴',
    '0700.HK': '腾讯控股',
    '3690.HK': '美团',
    '9988.HK': '阿里巴巴-SW',
    '2318.HK': '中国平安',
    '00005.HK': '汇丰控股',
    'TCEHY': '腾讯控股(ADR)',
    'NFLX': '奈飞',
    'AMD': 'AMD',
    'INTC': '英特尔',
    'CRM': 'Salesforce',
    'ADBE': 'Adobe',
    'PYPL': 'PayPal',
    'UBER': 'Uber',
    'LYFT': 'Lyft',
    'COIN': 'Coinbase',
    'PLTR': 'Palantir',
    'SNOW': 'Snowflake',
    'ZM': 'Zoom',
    'SHOP': 'Shopify',
    'SQ': 'Block',
    'ROKU': 'Roku',
    'DOCU': 'DocuSign',
    'PTON': 'Peloton',
    'ABNB': 'Airbnb',
    'DASH': 'DoorDash',
    'RIVN': 'Rivian',
    'LCID': 'Lucid',
    'NIO': '蔚来',
    'XPEV': '小鹏汽车',
    'LI': '理想汽车',
  };
  return companyMap[symbol.toUpperCase()] || symbol.toUpperCase();
};

// 格式化市值
const formatMarketCap = (value: number): string => {
  if (value > 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value > 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value > 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toString();
};

// 格式化成交量
const formatVolume = (value: number): string => {
  if (value > 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value > 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value > 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toString();
};

// 远程后端API地址
const REMOTE_API_URL = 'https://legal-nights-think.loca.lt';

// 检查后端API是否可用
const checkBackendAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${REMOTE_API_URL}/api/health`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
};

// 从后端API获取数据
const fetchFromBackend = async (symbol: string): Promise<{
  stockInfo: StockInfo;
  historicalPrices: HistoricalPrice[];
  financialData: FinancialData;
  news: NewsItem[];
} | null> => {
  try {
    // 获取股票信息
    const infoRes = await fetch(`${REMOTE_API_URL}/api/stock/${symbol}/info`);
    if (!infoRes.ok) throw new Error('Failed to fetch stock info');
    const infoData = await infoRes.json();
    const stockInfoRaw = parseCSV(infoData.data)[0];
    
    const currentPrice = parseFloat(stockInfoRaw['currentPrice'] || stockInfoRaw['Current Price'] || '0');
    const previousClose = parseFloat(stockInfoRaw['previousClose'] || stockInfoRaw['Previous Close'] || currentPrice.toString());
    const change = currentPrice - previousClose;
    
    const stockInfo: StockInfo = {
      symbol: symbol.toUpperCase(),
      name: stockInfoRaw['longName'] || stockInfoRaw['Long Name'] || getCompanyName(symbol),
      currentPrice,
      change,
      changePercent: previousClose > 0 ? (change / previousClose) * 100 : 0,
      marketCap: formatMarketCap(parseFloat(stockInfoRaw['marketCap'] || stockInfoRaw['Market Cap'] || '0')),
      volume: formatVolume(parseFloat(stockInfoRaw['volume'] || stockInfoRaw['Volume'] || '0')),
      weekHigh52: parseFloat(stockInfoRaw['fiftyTwoWeekHigh'] || stockInfoRaw['52 Week High'] || '0'),
      weekLow52: parseFloat(stockInfoRaw['fiftyTwoWeekLow'] || stockInfoRaw['52 Week Low'] || '0'),
      peRatio: parseFloat(stockInfoRaw['trailingPE'] || stockInfoRaw['Trailing P/E'] || '0') || undefined,
      pbRatio: parseFloat(stockInfoRaw['priceToBook'] || stockInfoRaw['Price to Book'] || '0') || undefined,
    };
    
    // 获取历史价格
    const historyRes = await fetch(`${REMOTE_API_URL}/api/stock/${symbol}/history?period=6mo&interval=1d`);
    if (!historyRes.ok) throw new Error('Failed to fetch historical data');
    const historyData = await historyRes.json();
    const historicalPrices: HistoricalPrice[] = parseCSV(historyData.data)
      .map((row: Record<string, string>) => ({
        date: row['Date'] || row['date'] || '',
        open: parseFloat(row['Open'] || row['open'] || '0'),
        high: parseFloat(row['High'] || row['high'] || '0'),
        low: parseFloat(row['Low'] || row['low'] || '0'),
        close: parseFloat(row['Close'] || row['close'] || '0'),
        volume: parseInt(row['Volume'] || row['volume'] || '0'),
      }))
      .filter((item: HistoricalPrice) => item.close > 0)
      .reverse();
    
    // 获取财务数据
    let financialData: FinancialData;
    try {
      const financialRes = await fetch(`${REMOTE_API_URL}/api/stock/${symbol}/financials`);
      if (financialRes.ok) {
        const financialDataRaw = await financialRes.json();
        const financial = parseCSV(financialDataRaw.data)[0];
        financialData = {
          revenue: parseFloat(financial['Total Revenue'] || '0') / 1e9 || Math.random() * 100 + 20,
          revenueGrowth: (Math.random() - 0.3) * 40,
          profitMargin: parseFloat(financial['Net Income'] || '0') / parseFloat(financial['Total Revenue'] || '1') * 100 || Math.random() * 20 + 5,
          debtToEquity: Math.random() * 1.5,
          currentRatio: Math.random() * 2 + 0.5,
          roe: Math.random() * 25 + 5,
        };
      } else {
        throw new Error('No financial data');
      }
    } catch {
      financialData = {
        revenue: Math.random() * 100 + 20,
        revenueGrowth: (Math.random() - 0.3) * 40,
        profitMargin: Math.random() * 20 + 5,
        debtToEquity: Math.random() * 1.5,
        currentRatio: Math.random() * 2 + 0.5,
        roe: Math.random() * 25 + 5,
      };
    }
    
    // 获取新闻
    let news: NewsItem[];
    try {
      const newsRes = await fetch(`${REMOTE_API_URL}/api/stock/${symbol}/news`);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        news = parseCSV(newsData.data).slice(0, 5).map((row: Record<string, string>) => ({
          title: row['title'] || row['Title'] || '无标题',
          source: row['publisher'] || row['Publisher'] || '未知来源',
          date: formatDate(row['published'] || row['Published'] || ''),
          sentiment: analyzeSentiment(row['title'] || row['Title'] || ''),
          url: row['url'] || row['URL'] || '',
        }));
      } else {
        throw new Error('No news data');
      }
    } catch {
      news = [
        { title: `${stockInfo.name}最新市场动态分析`, source: '财经网', date: '2小时前', sentiment: Math.random() > 0.4 ? 'positive' : 'negative' },
        { title: `分析师调整${stockInfo.name}目标价位`, source: '投资日报', date: '5小时前', sentiment: Math.random() > 0.3 ? 'positive' : 'neutral' },
        { title: `${stockInfo.name}行业前景展望`, source: '市场观察', date: '1天前', sentiment: Math.random() > 0.5 ? 'positive' : 'neutral' },
        { title: `${stockInfo.name}面临的机遇与挑战`, source: '商业评论', date: '2天前', sentiment: Math.random() > 0.6 ? 'negative' : 'neutral' },
        { title: `${stockInfo.name}业务发展动态`, source: '证券时报', date: '3天前', sentiment: 'positive' },
      ];
    }
    
    return { stockInfo, historicalPrices, financialData, news };
  } catch (error) {
    console.error('Backend fetch error:', error);
    return null;
  }
};

// 调用AI分析
const callAIAnalysis = async (stockData: {
  symbol: string;
  name: string;
  price: number;
  indicators: ReturnType<typeof calculateTechnicalIndicators>;
  financials: FinancialData;
  news: NewsItem[];
  history: HistoricalPrice[];
}): Promise<{
  marketObserver: MarketObserverView;
  bearishAnalyst: BearishAnalystView;
  bullishAnalyst: BullishAnalystView;
  managerDecision: ManagerDecision;
} | null> => {
  try {
    const response = await fetch(`${REMOTE_API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockData }),
    });
    
    if (!response.ok) {
      throw new Error('AI analysis failed');
    }
    
    const result = await response.json();
    return result.analysis;
  } catch (error) {
    console.error('AI analysis error:', error);
    return null;
  }
};

// 生成模拟数据
const generateMockData = (symbol: string): {
  stockInfo: StockInfo;
  historicalPrices: HistoricalPrice[];
  financialData: FinancialData;
  news: NewsItem[];
} => {
  const mockPrice = Math.random() * 200 + 50;
  const mockChange = (Math.random() - 0.5) * 10;
  
  const stockInfo: StockInfo = {
    symbol: symbol.toUpperCase(),
    name: getCompanyName(symbol),
    currentPrice: mockPrice,
    change: mockChange,
    changePercent: (mockChange / mockPrice) * 100,
    marketCap: `${(Math.random() * 2 + 0.1).toFixed(2)}T`,
    volume: `${(Math.random() * 50 + 5).toFixed(1)}M`,
    weekHigh52: mockPrice * 1.2,
    weekLow52: mockPrice * 0.8,
    peRatio: Math.random() * 30 + 10,
    pbRatio: Math.random() * 5 + 1,
  };

  const historicalPrices: HistoricalPrice[] = [];
  let currentPrice = mockPrice * 0.85;
  for (let i = 180; i >= 0; i--) {
    const change = (Math.random() - 0.48) * 5;
    currentPrice += change;
    historicalPrices.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      open: currentPrice - Math.random() * 2,
      high: currentPrice + Math.random() * 3,
      low: currentPrice - Math.random() * 3,
      close: currentPrice,
      volume: Math.floor(Math.random() * 10000000 + 5000000),
    });
  }

  const financialData: FinancialData = {
    revenue: Math.random() * 100 + 20,
    revenueGrowth: (Math.random() - 0.3) * 40,
    profitMargin: Math.random() * 20 + 5,
    debtToEquity: Math.random() * 1.5,
    currentRatio: Math.random() * 2 + 0.5,
    roe: Math.random() * 25 + 5,
  };

  const news: NewsItem[] = [
    { title: `${stockInfo.name}发布季度财报，业绩${Math.random() > 0.5 ? '超预期' : '不及预期'}`, source: '财经网', date: '2小时前', sentiment: Math.random() > 0.4 ? 'positive' : 'negative' },
    { title: `分析师${Math.random() > 0.5 ? '上调' : '下调'}${stockInfo.name}目标价`, source: '投资日报', date: '5小时前', sentiment: Math.random() > 0.3 ? 'positive' : 'neutral' },
    { title: `${stockInfo.name}宣布新产品线拓展计划`, source: '科技新闻', date: '1天前', sentiment: Math.random() > 0.5 ? 'positive' : 'neutral' },
    { title: `行业竞争加剧，${stockInfo.name}面临挑战`, source: '市场观察', date: '2天前', sentiment: Math.random() > 0.6 ? 'negative' : 'neutral' },
    { title: `${stockInfo.name}股东${Math.random() > 0.5 ? '增持' : '减持'}股份`, source: '证券时报', date: '3天前', sentiment: Math.random() > 0.5 ? 'positive' : 'negative' },
  ];

  return { stockInfo, historicalPrices, financialData, news };
};

export const useStockData = () => {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    result: null,
    progress: 0,
  });
  const [useRealData, setUseRealData] = useState<boolean>(false);
  const [useAI, setUseAI] = useState<boolean>(false);

  const analyzeStock = useCallback(async (symbol: string) => {
    setState({
      isLoading: true,
      error: null,
      result: null,
      progress: 0,
    });

    try {
      // 检查后端是否可用
      setState(prev => ({ ...prev, progress: 5 }));
      const backendAvailable = await checkBackendAvailable();
      setUseRealData(backendAvailable);
      
      let data;
      
      if (backendAvailable) {
        // 使用真实数据
        setState(prev => ({ ...prev, progress: 10 }));
        data = await fetchFromBackend(symbol);
        if (!data) {
          console.log('Backend fetch failed, falling back to mock data');
          data = generateMockData(symbol);
          setUseRealData(false);
        }
      } else {
        // 使用模拟数据
        await new Promise(resolve => setTimeout(resolve, 800));
        setState(prev => ({ ...prev, progress: 20 }));
        data = generateMockData(symbol);
      }

      const { stockInfo, historicalPrices, financialData, news } = data;

      // 计算技术指标
      setState(prev => ({ ...prev, progress: 40 }));
      const indicators = calculateTechnicalIndicators(historicalPrices);

      // AI分析或模拟分析
      setState(prev => ({ ...prev, progress: 60 }));
      
      let analysis;
      
      if (backendAvailable) {
        // 尝试调用AI分析
        const aiResult = await callAIAnalysis({
          symbol: stockInfo.symbol,
          name: stockInfo.name,
          price: stockInfo.currentPrice,
          indicators,
          financials: financialData,
          news,
          history: historicalPrices.slice(-20),
        });
        
        if (aiResult) {
          analysis = aiResult;
          setUseAI(true);
        } else {
          // AI分析失败，使用模拟分析
          const mockAnalysis = generateMockAnalysis(stockInfo, indicators, financialData, news);
          analysis = mockAnalysis;
          setUseAI(false);
        }
      } else {
        // 无后端，使用模拟分析
        const mockAnalysis = generateMockAnalysis(stockInfo, indicators, financialData, news);
        analysis = mockAnalysis;
        setUseAI(false);
      }

      // 整合结果
      setState(prev => ({ ...prev, progress: 90 }));
      
      const result: AnalysisResult = {
        stockInfo,
        marketObserver: analysis.marketObserver,
        bearishAnalyst: analysis.bearishAnalyst,
        bullishAnalyst: analysis.bullishAnalyst,
        news,
        managerDecision: analysis.managerDecision,
        lastUpdated: new Date().toISOString(),
      };

      setState({
        isLoading: false,
        error: null,
        result,
        progress: 100,
      });

      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : '分析失败，请重试',
        result: null,
        progress: 0,
      });
      return null;
    }
  }, []);

  return {
    ...state,
    useRealData,
    useAI,
    analyzeStock,
  };
};

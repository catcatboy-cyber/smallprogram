import { useState } from 'react';
import { SearchSection } from '@/sections/SearchSection';
import { StockInfoSection } from '@/sections/StockInfoSection';
import { AnalystCardsSection } from '@/sections/AnalystCardsSection';
import { ManagerDecisionSection } from '@/sections/ManagerDecisionSection';
import { FooterSection } from '@/sections/FooterSection';
import { useStockData } from '@/hooks/useStockData';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Database, Server, Brain, Cpu } from 'lucide-react';

function App() {
  const { isLoading, error, result, useRealData, useAI, analyzeStock } = useStockData();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (symbol: string) => {
    setHasSearched(true);
    const analysisResult = await analyzeStock(symbol);
    
    if (analysisResult) {
      toast.success(`成功分析 ${symbol.toUpperCase()}`, {
        description: `综合评分: ${analysisResult.managerDecision.score}分`,
      });
    } else if (error) {
      toast.error('分析失败', {
        description: error,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* 数据来源指示器 */}
      {hasSearched && (
        <div className="w-full px-[5%] pt-4">
          <div className="max-w-6xl mx-auto flex justify-end gap-2">
            {/* AI分析状态 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
              useAI 
                ? 'bg-purple-500/10 text-purple-400' 
                : 'bg-[#6a6a6a]/10 text-[#6a6a6a]'
            }`}>
              {useAI ? (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  <span>Kimi AI 分析</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>算法分析</span>
                </>
              )}
            </div>
            
            {/* 数据来源状态 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
              useRealData 
                ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                : 'bg-[#c5b8a5]/10 text-[#c5b8a5]'
            }`}>
              {useRealData ? (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Yahoo Finance 真实数据</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>模拟数据 (Demo)</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 头部搜索区域 */}
      <SearchSection onSearch={handleSearch} isLoading={isLoading} />

      {/* 股票基本信息 */}
      {hasSearched && (
        <StockInfoSection 
          stockInfo={result?.stockInfo || null} 
          isLoading={isLoading} 
        />
      )}

      {/* 角色分析卡片 */}
      {hasSearched && (
        <AnalystCardsSection
          marketObserver={result?.marketObserver || null}
          bearishAnalyst={result?.bearishAnalyst || null}
          bullishAnalyst={result?.bullishAnalyst || null}
          news={result?.news || null}
          isLoading={isLoading}
        />
      )}

      {/* 经理决策 */}
      {hasSearched && (
        <ManagerDecisionSection
          decision={result?.managerDecision || null}
          isLoading={isLoading}
        />
      )}

      {/* 页脚 */}
      <div className="flex-1" />
      <FooterSection />

      {/* Toast通知 */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            color: '#e5e5e5',
          },
        }}
      />
    </div>
  );
}

export default App;

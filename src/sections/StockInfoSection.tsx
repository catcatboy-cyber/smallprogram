import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
import type { StockInfo } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface StockInfoSectionProps {
  stockInfo: StockInfo | null;
  isLoading: boolean;
}

export const StockInfoSection = ({ stockInfo, isLoading }: StockInfoSectionProps) => {
  if (isLoading) {
    return (
      <section className="w-full px-[5%] mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <Skeleton className="h-8 w-48 bg-[#2a2a2a] mb-2" />
                <Skeleton className="h-12 w-32 bg-[#2a2a2a]" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-28 bg-[#2a2a2a]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!stockInfo) return null;

  const isPositive = stockInfo.change >= 0;
  const changeColor = isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]';
  const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <section className="w-full px-[5%] mb-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* 左侧：股票名称和价格 */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#2a2a2a] flex items-center justify-center">
                <span className="text-[#c5b8a5] font-bold text-lg">{stockInfo.symbol.slice(0, 2)}</span>
              </div>
              <div>
                <h2 className="text-xl font-medium text-[#e5e5e5]">{stockInfo.name}</h2>
                <p className="text-[#6a6a6a] text-sm">{stockInfo.symbol}</p>
              </div>
              <div className="ml-4 pl-4 border-l border-[#2a2a2a]">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light text-[#e5e5e5]">
                    ${stockInfo.currentPrice.toFixed(2)}
                  </span>
                  <span className={`flex items-center text-sm ${changeColor}`}>
                    <ChangeIcon className="w-4 h-4 mr-1" />
                    {isPositive ? '+' : ''}{stockInfo.change.toFixed(2)} ({isPositive ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 右侧：关键指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0f0f0f] rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#6a6a6a] text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  市值
                </div>
                <p className="text-[#e5e5e5] font-medium">{stockInfo.marketCap}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#6a6a6a] text-xs mb-1">
                  <BarChart3 className="w-3 h-3" />
                  成交量
                </div>
                <p className="text-[#e5e5e5] font-medium">{stockInfo.volume}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#6a6a6a] text-xs mb-1">
                  <Activity className="w-3 h-3" />
                  市盈率
                </div>
                <p className="text-[#e5e5e5] font-medium">{stockInfo.peRatio?.toFixed(2) || '--'}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#6a6a6a] text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  52周最高
                </div>
                <p className="text-[#e5e5e5] font-medium">${stockInfo.weekHigh52.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

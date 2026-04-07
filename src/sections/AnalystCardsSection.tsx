import { Eye, TrendingDown, TrendingUp, Newspaper, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import type { MarketObserverView, BearishAnalystView, BullishAnalystView, NewsItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AnalystCardsSectionProps {
  marketObserver: MarketObserverView | null;
  bearishAnalyst: BearishAnalystView | null;
  bullishAnalyst: BullishAnalystView | null;
  news: NewsItem[] | null;
  isLoading: boolean;
}

const MarketObserverCard = ({ data }: { data: MarketObserverView | null }) => {
  if (!data) return null;
  
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-[#c5b8a5] transition-all duration-300 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
          <Eye className="w-6 h-6 text-[#c5b8a5]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#e5e5e5]">{data.role}</h3>
          <span className="text-sm" style={{ color: data.labelColor }}>{data.label}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-[#a5a5a5] text-sm leading-relaxed">{data.analysis}</p>
        
        <div className="bg-[#0f0f0f] rounded-xl p-4">
          <h4 className="text-xs text-[#6a6a6a] mb-3 uppercase tracking-wider">关键指标</h4>
          <ul className="space-y-2">
            {data.keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#e5e5e5]">
                <CheckCircle2 className="w-4 h-4 text-[#c5b8a5] mt-0.5 flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex gap-4 pt-2">
          <div className="flex-1 bg-[#0f0f0f] rounded-lg p-3 text-center">
            <p className="text-xs text-[#6a6a6a] mb-1">支撑位</p>
            <p className="text-[#22c55e] font-medium">${data.supportLevel}</p>
          </div>
          <div className="flex-1 bg-[#0f0f0f] rounded-lg p-3 text-center">
            <p className="text-xs text-[#6a6a6a] mb-1">阻力位</p>
            <p className="text-[#ef4444] font-medium">${data.resistanceLevel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BearishAnalystCard = ({ data }: { data: BearishAnalystView | null }) => {
  if (!data) return null;
  
  return (
    <div 
      className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-[#ef4444] transition-all duration-300 h-full"
      style={{ borderLeftWidth: '4px', borderLeftColor: data.borderColor }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
          <TrendingDown className="w-6 h-6 text-[#ef4444]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#e5e5e5]">{data.role}</h3>
          <span className="text-sm" style={{ color: data.labelColor }}>{data.label}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-[#a5a5a5] text-sm leading-relaxed">{data.analysis}</p>
        
        <div className="bg-[#0f0f0f] rounded-xl p-4">
          <h4 className="text-xs text-[#6a6a6a] mb-3 uppercase tracking-wider">主要风险</h4>
          <ul className="space-y-2">
            {data.risks.slice(0, 4).map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#e5e5e5]">
                <AlertCircle className="w-4 h-4 text-[#ef4444] mt-0.5 flex-shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-[#ef4444]/10 rounded-xl p-4">
          <p className="text-xs text-[#ef4444]/70 mb-1">目标下行空间</p>
          <p className="text-[#ef4444] font-medium text-lg">{data.targetDownside}</p>
        </div>
      </div>
    </div>
  );
};

const BullishAnalystCard = ({ data }: { data: BullishAnalystView | null }) => {
  if (!data) return null;
  
  return (
    <div 
      className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-[#22c55e] transition-all duration-300 h-full"
      style={{ borderLeftWidth: '4px', borderLeftColor: data.borderColor }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-[#22c55e]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#e5e5e5]">{data.role}</h3>
          <span className="text-sm" style={{ color: data.labelColor }}>{data.label}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <p className="text-[#a5a5a5] text-sm leading-relaxed">{data.analysis}</p>
        
        <div className="bg-[#0f0f0f] rounded-xl p-4">
          <h4 className="text-xs text-[#6a6a6a] mb-3 uppercase tracking-wider">投资机会</h4>
          <ul className="space-y-2">
            {data.opportunities.slice(0, 4).map((opp, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#e5e5e5]">
                <Lightbulb className="w-4 h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-[#22c55e]/10 rounded-xl p-4">
          <p className="text-xs text-[#22c55e]/70 mb-1">目标上行空间</p>
          <p className="text-[#22c55e] font-medium text-lg">{data.targetUpside}</p>
        </div>
      </div>
    </div>
  );
};

const NewsCard = ({ news }: { news: NewsItem[] | null }) => {
  if (!news) return null;
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-[#22c55e]/20 text-[#22c55e]';
      case 'negative': return 'bg-[#ef4444]/20 text-[#ef4444]';
      default: return 'bg-[#6a6a6a]/20 text-[#6a6a6a]';
    }
  };
  
  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '正面';
      case 'negative': return '负面';
      default: return '中性';
    }
  };
  
  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] hover:border-[#c5b8a5] transition-all duration-300 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
          <Newspaper className="w-6 h-6 text-[#c5b8a5]" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-[#e5e5e5]">新闻热点</h3>
          <span className="text-sm text-[#a5a5a5]">最新动态</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {news.slice(0, 5).map((item, index) => (
          <div 
            key={index} 
            className="bg-[#0f0f0f] rounded-xl p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm text-[#e5e5e5] line-clamp-2 flex-1">{item.title}</h4>
              <Badge className={`${getSentimentColor(item.sentiment)} text-xs flex-shrink-0`}>
                {getSentimentText(item.sentiment)}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-[#6a6a6a]">
              <span>{item.source}</span>
              <span>•</span>
              <span>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LoadingCard = () => (
  <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] h-full">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-12 h-12 rounded-full bg-[#2a2a2a]" />
      <div>
        <Skeleton className="h-5 w-24 bg-[#2a2a2a] mb-1" />
        <Skeleton className="h-4 w-16 bg-[#2a2a2a]" />
      </div>
    </div>
    <Skeleton className="h-20 w-full bg-[#2a2a2a] mb-4" />
    <Skeleton className="h-32 w-full bg-[#2a2a2a]" />
  </div>
);

export const AnalystCardsSection = ({ 
  marketObserver, 
  bearishAnalyst, 
  bullishAnalyst, 
  news, 
  isLoading 
}: AnalystCardsSectionProps) => {
  if (isLoading) {
    return (
      <section className="w-full px-[5%] mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        </div>
      </section>
    );
  }

  if (!marketObserver && !bearishAnalyst && !bullishAnalyst && !news) return null;

  return (
    <section className="w-full px-[5%] mb-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-serif text-[#e5e5e5] mb-6">多角色分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MarketObserverCard data={marketObserver} />
          <NewsCard news={news} />
          <BearishAnalystCard data={bearishAnalyst} />
          <BullishAnalystCard data={bullishAnalyst} />
        </div>
      </div>
    </section>
  );
};

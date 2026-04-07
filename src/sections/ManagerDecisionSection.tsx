import { User, Target, ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown as TrendingDownIcon, AlertTriangle, Shield } from 'lucide-react';
import type { ManagerDecision } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ManagerDecisionSectionProps {
  decision: ManagerDecision | null;
  isLoading: boolean;
}

export const ManagerDecisionSection = ({ decision, isLoading }: ManagerDecisionSectionProps) => {
  if (isLoading) {
    return (
      <section className="w-full px-[5%] mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-8 border border-[#2a2a2a] border-t-4 border-t-[#c5b8a5]">
            <Skeleton className="h-8 w-48 bg-[#2a2a2a] mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="h-40 bg-[#2a2a2a]" />
              <Skeleton className="h-40 bg-[#2a2a2a]" />
              <Skeleton className="h-40 bg-[#2a2a2a]" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!decision) return null;

  const getDecisionConfig = (decision: ManagerDecision['decision']) => {
    switch (decision) {
      case 'strong_buy':
        return {
          icon: TrendingUp,
          color: '#22c55e',
          bgColor: 'bg-[#22c55e]/10',
          textColor: 'text-[#22c55e]',
          animation: 'animate-pulse',
        };
      case 'buy':
        return {
          icon: ArrowUp,
          color: '#22c55e',
          bgColor: 'bg-[#22c55e]/10',
          textColor: 'text-[#22c55e]',
          animation: '',
        };
      case 'hold':
        return {
          icon: Minus,
          color: '#c5b8a5',
          bgColor: 'bg-[#c5b8a5]/10',
          textColor: 'text-[#c5b8a5]',
          animation: '',
        };
      case 'sell':
        return {
          icon: ArrowDown,
          color: '#ef4444',
          bgColor: 'bg-[#ef4444]/10',
          textColor: 'text-[#ef4444]',
          animation: '',
        };
      case 'strong_sell':
        return {
          icon: TrendingDownIcon,
          color: '#ef4444',
          bgColor: 'bg-[#ef4444]/10',
          textColor: 'text-[#ef4444]',
          animation: 'animate-pulse',
        };
    }
  };

  const config = getDecisionConfig(decision.decision);
  const DecisionIcon = config.icon;

  return (
    <section className="w-full px-[5%] mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-2xl p-8 border border-[#2a2a2a] border-t-4 border-t-[#c5b8a5]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-full bg-[#c5b8a5]/10 flex items-center justify-center">
              <User className="w-7 h-7 text-[#c5b8a5]" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-[#e5e5e5]">投资经理决策</h2>
              <p className="text-sm text-[#a5a5a5]">综合各方观点后的最终建议</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：决策结论 */}
            <div className="lg:col-span-1">
              <div className={`${config.bgColor} rounded-2xl p-6 text-center ${config.animation}`}>
                <DecisionIcon className={`w-16 h-16 ${config.textColor} mx-auto mb-4`} />
                <h3 className={`text-3xl font-bold ${config.textColor} mb-2`}>
                  {decision.decisionText}
                </h3>
                <div className="mt-4">
                  <p className="text-xs text-[#6a6a6a] mb-1">综合评分</p>
                  <div className="flex items-center justify-center gap-3">
                    <Progress 
                      value={decision.score} 
                      className="w-32 h-3 bg-[#0f0f0f]" 
                    />
                    <span className={`text-xl font-bold ${config.textColor}`}>
                      {decision.score}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 中间：价格建议 */}
            <div className="lg:col-span-1">
              <div className="bg-[#0f0f0f] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-[#c5b8a5]" />
                  <h4 className="text-sm text-[#6a6a6a] uppercase tracking-wider">价格建议</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-4 h-4 text-[#22c55e]" />
                      <span className="text-sm text-[#a5a5a5]">入场价</span>
                    </div>
                    <span className="text-xl font-bold text-[#22c55e]">${decision.entryPrice}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#c5b8a5]" />
                      <span className="text-sm text-[#a5a5a5]">抛出价</span>
                    </div>
                    <span className="text-xl font-bold text-[#c5b8a5]">${decision.exitPrice}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#ef4444]" />
                      <span className="text-sm text-[#a5a5a5]">止损价</span>
                    </div>
                    <span className="text-xl font-bold text-[#ef4444]">${decision.stopLoss}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：风险收益比 */}
            <div className="lg:col-span-1">
              <div className="bg-[#0f0f0f] rounded-2xl p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-[#c5b8a5]" />
                  <h4 className="text-sm text-[#6a6a6a] uppercase tracking-wider">风险收益评估</h4>
                </div>
                
                <div className="text-center py-6">
                  <p className="text-xs text-[#6a6a6a] mb-2">风险收益比</p>
                  <p className="text-5xl font-bold text-[#c5b8a5] mb-2">
                    1:{decision.riskRewardRatio}
                  </p>
                  <p className="text-sm text-[#a5a5a5]">
                    {parseFloat(decision.riskRewardRatio) >= 2 
                      ? '风险收益比优秀' 
                      : parseFloat(decision.riskRewardRatio) >= 1.5 
                        ? '风险收益比良好' 
                        : '风险收益比一般'}
                  </p>
                </div>

                <div className="mt-4 p-4 bg-[#1a1a1a] rounded-xl">
                  <p className="text-xs text-[#6a6a6a] mb-2">预期收益</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                    <span className="text-lg font-bold text-[#22c55e]">
                      {((parseFloat(decision.exitPrice) - parseFloat(decision.entryPrice)) / parseFloat(decision.entryPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部：深度分析 */}
          <div className="mt-8 p-6 bg-[#0f0f0f] rounded-2xl">
            <h4 className="text-sm text-[#6a6a6a] uppercase tracking-wider mb-4">深度分析</h4>
            <div className="text-[#a5a5a5] text-sm leading-relaxed whitespace-pre-line">
              {decision.reasoning}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchSectionProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

export const SearchSection = ({ onSearch, isLoading }: SearchSectionProps) => {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim() && !isLoading) {
      onSearch(symbol.trim());
    }
  };

  return (
    <section className="w-full py-12 px-[5%]">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="font-serif text-4xl md:text-5xl font-light text-[#e5e5e5] mb-4 animate-fade-in">
          AI股票分析系统
        </h1>
        <p className="text-[#a5a5a5] text-lg mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          多角色智能分析，辅助投资决策
        </p>
        
        <form onSubmit={handleSubmit} className="flex gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="输入股票代码 (如: AAPL, TSLA, 0700.HK)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full h-14 bg-[#1a1a1a] border-[#2a2a2a] rounded-xl text-[#e5e5e5] placeholder:text-[#6a6a6a] focus:border-[#c5b8a5] focus:ring-[#c5b8a5] text-base pl-5"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !symbol.trim()}
            className="h-14 px-8 bg-[#c5b8a5] hover:bg-[#b5a895] text-[#0f0f0f] font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                分析
              </>
            )}
          </Button>
        </form>
        
        <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <span className="text-[#6a6a6a] text-sm">热门:</span>
          {['AAPL', 'TSLA', 'NVDA', '0700.HK', 'BABA'].map((code) => (
            <button
              key={code}
              onClick={() => setSymbol(code)}
              className="px-3 py-1 text-sm text-[#a5a5a5] bg-[#1a1a1a] rounded-full hover:bg-[#2a2a2a] hover:text-[#e5e5e5] transition-colors"
              disabled={isLoading}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

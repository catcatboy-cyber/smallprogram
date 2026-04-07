import { AlertCircle } from 'lucide-react';

export const FooterSection = () => {
  return (
    <footer className="w-full px-[5%] py-8 border-t border-[#2a2a2a]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-[#c5b8a5] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#a5a5a5] leading-relaxed">
            免责声明：本系统提供的分析仅供参考，不构成任何投资建议。股市有风险，投资需谨慎。
            投资者应根据自身情况独立判断，自行承担投资风险。
          </p>
        </div>
        
        <div className="text-center text-xs text-[#6a6a6a]">
          <p>© 2024 AI股票分析系统. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

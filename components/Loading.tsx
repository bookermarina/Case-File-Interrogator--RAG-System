
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { Loader2, FileText, Search, Shield, Database, Lock, Binary, Fingerprint } from 'lucide-react';

interface LoadingProps {
  status: string;
  step: number;
  facts?: string[];
}

const Loading: React.FC<LoadingProps> = ({ status, step, facts = [] }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  useEffect(() => {
    if (facts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % facts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [facts]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto mt-8 min-h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in slide-in-up duration-700">
      
      {/* Icon Animation */}
      <div className="relative z-20 mb-8 mt-8">
           <div className="bg-slate-50 p-6 rounded-full flex items-center justify-center w-20 h-20 relative overflow-hidden border border-slate-200 shadow-inner">
              <Binary className="w-8 h-8 text-indigo-500 relative z-10 animate-pulse" />
           </div>
           {/* Rings */}
           <div className="absolute inset-0 -m-4 border border-slate-100 rounded-full animate-[spin_4s_linear_infinite]"></div>
           <div className="absolute inset-0 -m-4 border-t-2 border-indigo-200 rounded-full animate-[spin_3s_linear_infinite]"></div>
      </div>

      {/* Status Panel */}
      <div className="relative z-30 w-full px-12 pb-12 text-center flex flex-col items-center">
        
        <div className="flex items-center gap-3 mb-6 w-full justify-center">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <h3 className="text-indigo-900 font-bold text-xs tracking-[0.2em] uppercase font-mono">
            {status}
            </h3>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 w-full h-12">
            {facts.length > 0 ? (
            <div key={currentFactIndex} className="animate-in slide-in-up fade-in duration-500 w-full text-center">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                   "{facts[currentFactIndex]}"
                </p>
            </div>
            ) : (
            <div className="text-slate-400 italic font-mono text-xs">
                <span>Establishing secure neural uplink...</span>
            </div>
            )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-64 h-1 bg-slate-100 mt-8 rounded-full overflow-hidden mx-auto">
            <div 
              className="h-full bg-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${step * 33 + 10}%` }}
            ></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';
import { Loader2, FileText, Search, Shield, Database, Scale, Lock, Eye, Binary, Fingerprint } from 'lucide-react';

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

  const FlyingItem = ({ delay, position, type, content }: { delay: number, position: number, type: 'icon' | 'text', content: any }) => {
    const startLeft = position % 2 === 0 ? '-20%' : '120%';
    const startTop = `${(position * 7) % 100}%`;
    
    return (
      <div 
        className={`absolute flex items-center justify-center font-bold opacity-0 select-none ${type === 'text' ? 'text-cyan-400 text-[9px] font-mono tracking-widest bg-slate-900/90 border border-cyan-500/30 px-2 py-1' : 'text-slate-600'}`}
        style={{
          animation: `implode 2.5s infinite ease-in-out ${delay}s`,
          top: startTop,
          left: startLeft,
          zIndex: 10,
        }}
      >
        {type === 'icon' ? React.createElement(content, { className: "w-4 h-4 text-cyan-600" }) : content}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto mt-8 min-h-[400px] overflow-hidden rounded-xl border border-slate-700/50 bg-slate-950/60 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-up duration-700">
      
      <style>{`
        @keyframes implode {
          0% { transform: scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: scale(0.2); opacity: 0; top: 40%; left: 50%; }
        }
        @keyframes scan-radar {
            0% { transform: rotate(0deg); border-color: rgba(6,182,212,0.1); }
            50% { border-color: rgba(6,182,212,0.5); }
            100% { transform: rotate(360deg); border-color: rgba(6,182,212,0.1); }
        }
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(6,182,212,0.1); }
            50% { box-shadow: 0 0 40px rgba(6,182,212,0.3); }
        }
      `}</style>

      {/* THE LOGIC ENGINE */}
      <div className="relative z-20 mb-12 scale-[0.9] md:scale-100 mt-8">
        {/* Radar Rings */}
        <div className="absolute inset-0 w-64 h-64 -translate-x-[4.5rem] -translate-y-[4.5rem] border border-slate-800/60 rounded-full"></div>
        <div className="absolute inset-0 w-64 h-64 -translate-x-[4.5rem] -translate-y-[4.5rem] border-t-2 border-cyan-500/30 rounded-full animate-[scan-radar_6s_linear_infinite]"></div>
        <div className="absolute inset-0 w-48 h-48 -translate-x-12 -translate-y-12 border border-slate-800/60 rounded-full"></div>
        <div className="absolute inset-0 w-48 h-48 -translate-x-12 -translate-y-12 border-b-2 border-cyan-500/40 rounded-full animate-[scan-radar_3s_linear_infinite_reverse]"></div>
        
        {/* Core */}
        <div className="relative bg-slate-900 p-1 rounded-full animate-[pulse-glow_3s_infinite]">
           <div className="bg-slate-950 p-6 rounded-full flex items-center justify-center w-24 h-24 relative overflow-hidden border border-cyan-500/30">
              <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>
              <Binary className="w-10 h-10 text-cyan-400 relative z-10" />
           </div>
        </div>

        {/* Data Stream */}
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
           <FlyingItem content={FileText} type="icon" delay={0} position={1} />
           <FlyingItem content="PARSING" type="text" delay={0.2} position={2} />
           <FlyingItem content={Search} type="icon" delay={0.6} position={3} />
           <FlyingItem content="ANALYSIS" type="text" delay={0.8} position={4} />
           <FlyingItem content={Fingerprint} type="icon" delay={1.2} position={5} />
           <FlyingItem content="IDENTITY" type="text" delay={1.4} position={6} />
           <FlyingItem content={Database} type="icon" delay={1.8} position={7} />
           <FlyingItem content="HISTORY" type="text" delay={2.0} position={8} />
           <FlyingItem content={Lock} type="icon" delay={2.4} position={9} />
           <FlyingItem content="SECURITY" type="text" delay={2.6} position={10} />
        </div>
      </div>

      {/* Status Panel */}
      <div className="relative z-30 w-full max-w-lg bg-slate-900/80 border border-slate-700/40 rounded-xl p-8 text-center flex flex-col items-center min-h-[160px] backdrop-blur-md">
        
        <div className="flex items-center gap-4 mb-6 w-full border-b border-slate-800 pb-3">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <h3 className="text-cyan-400 font-bold text-[10px] tracking-[0.2em] uppercase font-mono flex-1 text-left text-glow-sm">
            SYSTEM STATUS: {status}
            </h3>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 w-full">
            {facts.length > 0 ? (
            <div key={currentFactIndex} className="animate-in slide-in-up fade-in duration-500 w-full text-left">
                <p className="text-[10px] text-slate-500 font-mono uppercase mb-2 tracking-wider">Processing Entity:</p>
                <div className="flex items-center gap-3">
                   <div className="w-1 h-8 bg-cyan-500 rounded-full"></div>
                   <p className="text-sm md:text-base text-white font-mono leading-relaxed">
                     {facts[currentFactIndex]}
                   </p>
                </div>
            </div>
            ) : (
            <div className="flex items-center gap-2 text-slate-500 italic font-mono text-xs animate-pulse">
                <span>Establishing secure neural uplink...</span>
            </div>
            )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800 mt-6 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-700 ease-out relative"
              style={{ width: `${step * 33 + 10}%` }}
            >
                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
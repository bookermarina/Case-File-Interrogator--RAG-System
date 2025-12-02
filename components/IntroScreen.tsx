/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Shield, Lock, Scan, FileText } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 1200); 
    const timer2 = setTimeout(() => setPhase(2), 3500); 
    const timer3 = setTimeout(() => setPhase(3), 5000); 

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden font-display select-none">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[length:40px_40px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/0 via-slate-950/80 to-slate-950"></div>
      
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
        
        {/* PHASE 0 & 1: Biometric Lock */}
        <div className={`relative transition-all duration-1000 ease-in-out ${phase >= 2 ? 'scale-0 opacity-0 blur-xl' : 'scale-100 opacity-100 blur-0'}`}>
           <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 border border-slate-800/50 rounded-full"></div>
              <div className="absolute inset-0 border-t border-cyan-500/60 rounded-full animate-spin"></div>
              <div className="absolute inset-4 border border-slate-800/50 rounded-full"></div>
              <div className="absolute inset-4 border-b border-cyan-500/40 rounded-full animate-spin reverse-spin"></div>
              
              <Lock className="w-12 h-12 text-slate-700 animate-pulse" />
           </div>
           {phase === 1 && (
               <div className="absolute -bottom-16 w-full text-center space-y-2 animate-in fade-in slide-in-up duration-500">
                   <div className="h-0.5 w-24 bg-cyan-900/50 mx-auto overflow-hidden rounded-full">
                       <div className="h-full bg-cyan-500 w-full animate-[shimmer_1.5s_infinite]"></div>
                   </div>
                   <p className="text-cyan-500 text-[10px] font-mono tracking-[0.3em]">AUTHENTICATING...</p>
               </div>
           )}
        </div>

        {/* PHASE 2 & 3: Shield Icon */}
        <div className={`absolute flex flex-col items-center justify-center transition-all duration-1000 ease-out ${phase >= 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
           <div className="relative p-8 border border-cyan-500/20 bg-cyan-950/10 rounded-2xl backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Shield className="w-28 h-28 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-700 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
           </div>
        </div>
      </div>

      {/* PHASE 3: UI REVEAL */}
      <div className={`absolute bottom-24 flex flex-col items-center transition-all duration-1000 ease-out px-6 ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
         <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 tracking-widest text-center uppercase font-display text-glow">
            Case File <span className="text-cyan-400">Interrogator</span>
         </h1>
         
         <div className="flex flex-col items-center gap-4 mb-10 text-center">
            <p className="text-slate-500 text-xs md:text-sm uppercase tracking-[0.4em] font-mono">Secure RAG System Initialized</p>
         </div>
         
         <button 
            onClick={onComplete}
            className="group relative px-12 py-4 bg-cyan-950/30 border border-cyan-500/40 hover:bg-cyan-900/40 transition-all uppercase tracking-[0.2em] text-xs font-bold text-cyan-100 overflow-hidden"
         >
            <span className="relative z-10 group-hover:text-white transition-colors">Access System</span>
            <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
         </button>
      </div>

    </div>
  );
};

export default IntroScreen;
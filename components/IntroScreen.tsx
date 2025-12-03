
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 1000); 
    const timer2 = setTimeout(() => setPhase(2), 2500); 
    const timer3 = setTimeout(() => setPhase(3), 3500); 

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center overflow-hidden font-display select-none text-slate-900">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[length:40px_40px]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-white/80 to-slate-50"></div>
      
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
        
        {/* PHASE 0 & 1: Biometric Lock */}
        <div className={`relative transition-all duration-1000 ease-in-out ${phase >= 2 ? 'scale-0 opacity-0 blur-xl' : 'scale-100 opacity-100 blur-0'}`}>
           <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 border border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-t border-indigo-500 rounded-full animate-spin"></div>
              
              <Lock className="w-10 h-10 text-slate-400 animate-pulse" />
           </div>
           {phase === 1 && (
               <div className="absolute -bottom-12 w-full text-center space-y-2 animate-in fade-in slide-in-up duration-500">
                   <p className="text-indigo-600 text-[10px] font-mono tracking-[0.3em] uppercase">Authenticating...</p>
               </div>
           )}
        </div>

        {/* PHASE 2 & 3: Shield Icon */}
        <div className={`absolute flex flex-col items-center justify-center transition-all duration-1000 ease-out ${phase >= 2 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
           <div className="relative p-8 border border-indigo-100 bg-white rounded-2xl shadow-xl">
              <Shield className="w-24 h-24 text-indigo-600" />
           </div>
        </div>
      </div>

      {/* PHASE 3: UI REVEAL */}
      <div className={`absolute bottom-24 flex flex-col items-center transition-all duration-1000 ease-out px-6 ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
         <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3 tracking-widest text-center uppercase font-display">
            Case File <span className="text-indigo-600">Interrogator</span>
         </h1>
         
         <div className="flex flex-col items-center gap-4 mb-10 text-center">
            <p className="text-slate-500 text-xs md:text-sm uppercase tracking-[0.4em] font-mono">Secure RAG System Initialized</p>
         </div>
         
         <button 
            onClick={onComplete}
            className="group relative px-10 py-3 bg-slate-900 hover:bg-slate-800 transition-all uppercase tracking-[0.2em] text-xs font-bold text-white shadow-lg rounded-lg overflow-hidden"
         >
            <span className="relative z-10">Access System</span>
         </button>
      </div>

    </div>
  );
};

export default IntroScreen;
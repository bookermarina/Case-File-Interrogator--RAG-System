
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Menu, PanelRightClose, PanelRightOpen, Shield } from 'lucide-react';

interface DashboardLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  children: React.ReactNode; // Center panel content (Chat Stream)
  isLeftOpen: boolean;
  isRightOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  chatStatus: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  leftPanel,
  rightPanel,
  children,
  isLeftOpen,
  isRightOpen,
  onToggleLeft,
  onToggleRight,
  chatStatus
}) => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden relative">
        {/* LEFT PANEL (EVIDENCE LOCKER) */}
        <div className={`
            flex-shrink-0 bg-slate-50 border-r border-slate-200 z-30 transition-all duration-300 absolute md:static h-full shadow-xl md:shadow-none
            ${isLeftOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden opacity-0 md:opacity-100'}
        `}>
            <div className="w-64 h-full relative">
                {leftPanel}
            </div>
        </div>

        {/* MOBILE OVERLAY LEFT */}
        {isLeftOpen && (
            <div className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm" onClick={onToggleLeft} />
        )}

        {/* CENTER PANEL (STREAM) */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200 relative min-w-0">
             {/* HEADER */}
             <header className="h-16 border-b border-slate-100 flex items-center px-4 md:px-6 justify-between flex-shrink-0 bg-white/80 backdrop-blur z-10 sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onToggleLeft} className="md:hidden p-2 hover:bg-slate-100 rounded text-slate-500">
                        <Menu className="w-5 h-5" />
                    </button>
                    <Shield className="w-4 h-4 text-indigo-600 hidden sm:block" />
                    <span className="font-bold text-sm tracking-widest uppercase truncate">Interrogation Stream</span>
                </div>
                <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${chatStatus ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase hidden sm:inline">{chatStatus ? 'Online' : 'Offline'}</span>
                     </div>
                     <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                     <button 
                        onClick={onToggleRight}
                        className={`p-2 rounded-md transition-colors ${isRightOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Toggle Case Studio"
                     >
                        {isRightOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                     </button>
                </div>
             </header>

             {/* CONTENT */}
             <div className="flex-1 flex flex-col overflow-hidden relative">
                {children}
             </div>
        </div>

        {/* RIGHT PANEL (CASE STUDIO) */}
        <div className={`
            flex-shrink-0 bg-slate-50 z-20 border-l border-slate-200 transition-all duration-300 ease-in-out
            ${isRightOpen ? 'w-80 lg:w-96 translate-x-0' : 'w-0 translate-x-full overflow-hidden opacity-0'}
            absolute right-0 top-0 bottom-0 lg:static h-full shadow-2xl lg:shadow-none
        `}>
            <div className="w-80 lg:w-96 h-full relative">
                {rightPanel}
            </div>
        </div>
        
        {/* MOBILE OVERLAY RIGHT */}
        {isRightOpen && (
            <div className="fixed inset-0 bg-black/20 z-10 lg:hidden backdrop-blur-sm" onClick={onToggleRight} />
        )}
    </div>
  );
};

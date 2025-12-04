
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef } from 'react';
import { CaseSource } from '../types';
import { UploadCloud, FileText, X, CheckCircle, Image, Circle } from 'lucide-react';

interface SourcePanelProps {
  sources: CaseSource[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onToggleSelect: (id: string) => void;
  isReading: boolean;
}

const SourcePanel: React.FC<SourcePanelProps> = ({ sources, onUpload, onRemove, onToggleSelect, isReading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      <div className="h-16 flex items-center px-4 border-b border-slate-200 bg-white">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Evidence Locker</h2>
        <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-mono">{sources.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.map((source) => (
          <div 
            key={source.id}
            className={`group relative p-3 rounded-lg border transition-all cursor-pointer ${source.isSelected ? 'bg-white border-indigo-200 shadow-sm' : 'bg-slate-100 border-transparent opacity-70 hover:opacity-100'}`}
            onClick={() => onToggleSelect(source.id)}
          >
            <div className="flex items-start gap-3">
               <div className={`mt-1 ${source.isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                 {source.type === 'pdf' ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
               </div>
               <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${source.isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{source.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono mt-1">{new Date(source.timestamp).toLocaleTimeString()}</p>
               </div>
               <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(source.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded transition-all"
               >
                 <X className="w-3 h-3" />
               </button>
            </div>
            
            {/* Selection Indicator */}
            <div className="absolute top-3 right-3 pointer-events-none">
                {source.isSelected ? <CheckCircle className="w-3 h-3 text-indigo-500" /> : <Circle className="w-3 h-3 text-slate-300" />}
            </div>
          </div>
        ))}

        <div 
          onClick={() => !isReading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-300 hover:bg-white transition-all ${isReading ? 'opacity-50' : ''}`}
        >
           <UploadCloud className="w-6 h-6 text-slate-400" />
           <span className="text-[10px] font-bold text-slate-500 uppercase">Add Source</span>
           <input ref={fileInputRef} type="file" onChange={onUpload} className="hidden" accept="application/pdf, text/plain, image/*" multiple />
        </div>
      </div>
    </div>
  );
};

export default SourcePanel;

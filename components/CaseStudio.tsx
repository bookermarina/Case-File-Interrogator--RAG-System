
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { CaseArtifact, AnalysisDepth } from '../types';
import { FileText, Image, Play, Network, Layout, Zap, Plus, ArrowRight, PenTool, Crosshair, ScrollText, CheckCircle2 } from 'lucide-react';

interface CaseStudioProps {
  artifacts: CaseArtifact[];
  recommendedProtocols: AnalysisDepth[];
  onRunProtocol: (protocol: string) => void;
  onOpenArtifact: (artifact: CaseArtifact) => void;
}

const CaseStudio: React.FC<CaseStudioProps> = ({ artifacts, recommendedProtocols, onRunProtocol, onOpenArtifact }) => {
  
  const getIcon = (type: string) => {
      switch(type) {
          case 'report': return FileText;
          case 'visual': return Image;
          case 'video': return Play;
          case 'mindmap': return Network;
          case 'document': return Layout;
          default: return FileText;
      }
  };

  const formatProtocolLabel = (label: string) => {
      // Remove [[EXECUTE:]] wrapper and cleanup
      return label.replace(/\[\[EXECUTE:(.*?)\]\]/g, '$1').replace(/_/g, ' ').trim();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
       <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white justify-between">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Case Studio</h2>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-[10px] text-slate-500 font-mono">Ready</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
         
         {/* ZONE A: SUGGESTED ACTIONS */}
         <div className="space-y-4">
             <div className="flex items-center gap-2 text-indigo-600">
                 <Zap className="w-4 h-4" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest">Suggested Protocols</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
                 {recommendedProtocols && recommendedProtocols.length > 0 ? recommendedProtocols.map((p, i) => {
                     const label = formatProtocolLabel(p);
                     return (
                        <button 
                            key={i}
                            onClick={() => onRunProtocol(label)}
                            className="group relative flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                                    <Zap className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-800">{label}</span>
                            </div>
                            <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                <ArrowRight className="w-4 h-4 text-indigo-500" />
                            </div>
                        </button>
                     );
                 }) : (
                     <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center">
                         <p className="text-[10px] text-slate-400 italic">Analysis in progress... Protocol recommendations pending.</p>
                     </div>
                 )}
             </div>
         </div>

         {/* ZONE C: FORENSIC TOOLS (Always Available) */}
         <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-500">
                 <PenTool className="w-4 h-4" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest">Forensic Tools</h3>
             </div>
             <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => onRunProtocol('Investigative Mind Map')} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors"><Network className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" /></div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">Mind Map</span>
                 </button>
                 <button onClick={() => onRunProtocol('Timeline Visualization')} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors"><Layout className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" /></div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">Timeline</span>
                 </button>
                 <button onClick={() => onRunProtocol('Crime Scene Sketch')} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors"><Crosshair className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" /></div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">Sketch</span>
                 </button>
                 <button onClick={() => onRunProtocol("Liar's List")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors"><FileText className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" /></div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">Liar's List</span>
                 </button>
                 <button onClick={() => onRunProtocol("Draft Demand Letter")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors"><ScrollText className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" /></div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">Demand Letter</span>
                 </button>
                 <button onClick={() => onRunProtocol("Draft Internal Case Memo")} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors"><CheckCircle2 className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" /></div>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-700">Case Memo</span>
                 </button>
             </div>
         </div>

         {/* ZONE B: ARTIFACTS */}
         <div className="space-y-4">
             <div className="flex items-center gap-2 text-slate-500">
                 <Layout className="w-4 h-4" />
                 <h3 className="text-[10px] font-bold uppercase tracking-widest">Case Artifacts</h3>
             </div>
             
             <div className="grid grid-cols-1 gap-3">
                 {artifacts && artifacts.length > 0 ? artifacts.map((art) => {
                     const Icon = getIcon(art.type);
                     return (
                        <div 
                            key={art.id}
                            onClick={() => onOpenArtifact(art)}
                            className="group bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-4 h-4 text-indigo-400" />
                            </div>
                            
                            <div className="flex items-start gap-3 mb-2">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-700">{art.title}</h4>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">{art.type}</span>
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mb-3 pl-1">
                                {art.summary}
                            </p>

                            <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[9px] text-slate-300 font-mono group-hover:text-indigo-300 transition-colors">{new Date(art.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                     );
                 }) : (
                     <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
                         <p className="text-xs text-slate-400">No artifacts generated.</p>
                     </div>
                 )}
             </div>
         </div>

      </div>
    </div>
  );
};

export default CaseStudio;

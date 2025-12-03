
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GeneratedContent, CaseSummary, AssetTab, DocumentType } from '../types';
import { FileText, Image, Network, Scale, Download, Maximize2, X, Clipboard, ExternalLink } from 'lucide-react';
import Infographic from './Infographic';
import SearchResults from './SearchResults';
import MindMap from './MindMap';

interface AssetSidebarProps {
  summary: CaseSummary | null;
  findings: string[];
  visuals: GeneratedContent[];
  documents: { title: string, content: string, type: DocumentType }[];
  precedents: any[];
  mindMapData: any;
  onEditVisual: (prompt: string) => void;
  onGenerateMindMap: () => void;
  onNodeClick: (node: any) => void;
}

const AssetSidebar: React.FC<AssetSidebarProps> = ({ 
  summary, findings, visuals, documents, precedents, mindMapData, onEditVisual, onGenerateMindMap, onNodeClick
}) => {
  const [activeTab, setActiveTab] = useState<AssetTab>('analysis');
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);

  const TabButton = ({ id, icon: Icon, label }: { id: AssetTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
        activeTab === id 
          ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10' 
          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'
      }`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-950/50 border-l border-slate-800/60 backdrop-blur-sm">
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 scrollbar-hide">
        <TabButton id="analysis" icon={Scale} label="Findings" />
        <TabButton id="visuals" icon={Image} label="Evidence" />
        <TabButton id="documents" icon={FileText} label="Docs" />
        <TabButton id="graph" icon={Network} label="Graph" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in fade-in">
            {summary && (
              <div className="glass-panel p-5 rounded-lg border border-cyan-500/20">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Case Abstract</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-950/50 p-2 rounded">
                        <span className="text-[9px] text-slate-500 block uppercase">Incident</span>
                        <span className="text-xs font-bold text-white truncate block">{summary.incidentType}</span>
                    </div>
                    <div className="bg-slate-950/50 p-2 rounded">
                        <span className="text-[9px] text-slate-500 block uppercase">Jurisdiction</span>
                        <span className="text-xs text-slate-300 truncate block">{summary.jurisdiction}</span>
                    </div>
                </div>
                <p className="text-sm text-slate-300 font-mono leading-relaxed">{summary.synopsis}</p>
                {summary.tags && (
                   <div className="flex flex-wrap gap-2 mt-3">
                       {summary.tags.map((tag, i) => (
                           <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/20 uppercase">{tag}</span>
                       ))}
                   </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Key Findings</h3>
              {findings.map((f, i) => (
                <div key={i} className="p-3 bg-slate-900/40 border border-slate-800 rounded hover:border-cyan-500/30 transition-colors">
                   <div className="flex gap-3">
                       <span className="text-cyan-600 font-mono text-xs opacity-70">0{i+1}</span>
                       <p className="text-sm text-slate-300 font-mono">{f}</p>
                   </div>
                </div>
              ))}
              {findings.length === 0 && <p className="text-xs text-slate-600 italic p-4 text-center">No findings analyzed yet.</p>}
            </div>

            {precedents.length > 0 && <SearchResults results={precedents} />}
          </div>
        )}

        {/* VISUALS TAB */}
        {activeTab === 'visuals' && (
          <div className="space-y-8 animate-in fade-in">
            {visuals.length > 0 ? visuals.map((content) => (
               <div key={content.id} className="border-b border-slate-800 pb-8 last:border-0">
                   <Infographic content={content} onEdit={onEditVisual} isEditing={false} />
               </div>
            )) : (
               <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                   <Image className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-xs uppercase tracking-widest">No Visuals Generated</p>
               </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
           <div className="space-y-4 animate-in fade-in">
              {documents.length > 0 ? documents.map((doc, i) => (
                  <div key={i} className="glass-panel p-4 rounded-lg border border-slate-800 hover:border-cyan-500/30 transition-all cursor-pointer" onClick={() => setSelectedDoc(selectedDoc === i ? null : i)}>
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-cyan-500" />
                              <span className="text-xs font-bold text-white uppercase tracking-wider">{doc.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-500 uppercase">{doc.type}</span>
                      </div>
                      {selectedDoc === i ? (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">{doc.content}</pre>
                              <div className="flex justify-end mt-3 gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(doc.content); }} className="p-1.5 rounded hover:bg-slate-800 text-slate-400" title="Copy"><Clipboard className="w-3 h-3" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); /* Download logic */ }} className="p-1.5 rounded hover:bg-slate-800 text-slate-400" title="Download"><Download className="w-3 h-3" /></button>
                              </div>
                          </div>
                      ) : (
                          <p className="text-xs text-slate-500 line-clamp-2">{doc.content}</p>
                      )}
                  </div>
              )) : (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                   <FileText className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-xs uppercase tracking-widest">No Documents Drafted</p>
               </div>
              )}
           </div>
        )}

        {/* GRAPH TAB */}
        {activeTab === 'graph' && (
            <div className="h-[600px] animate-in fade-in relative">
                {mindMapData ? (
                    <MindMap data={mindMapData} onNodeClick={onNodeClick} onClose={() => {}} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600">
                        <Network className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-xs uppercase tracking-widest mb-4">No Investigation Map</p>
                        <button 
                            onClick={onGenerateMindMap}
                            className="btn-primary px-4 py-2 rounded text-xs font-bold uppercase tracking-wider"
                        >
                            Generate Map
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AssetSidebar;


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GeneratedContent, CaseSummary, AssetTab, GeneratedDocument, FindingAsset, ViewMode } from '../types';
import { FileText, Image, Network, Scale, Download, Clipboard, Code, BookOpen, Clock, Tag } from 'lucide-react';
import Infographic from './Infographic';
import SearchResults from './SearchResults';
import MindMap from './MindMap';

interface AssetSidebarProps {
  summary: CaseSummary | null;
  findings: FindingAsset[];
  visuals: GeneratedContent[];
  documents: GeneratedDocument[];
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
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('technical');

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'technical' ? 'reader' : 'technical');
  };

  const TabButton = ({ id, icon: Icon, label }: { id: AssetTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-3 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-colors flex-1 justify-center ${
        activeTab === id 
          ? 'border-indigo-600 text-indigo-700 bg-white' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-3 h-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200">
      
      {/* Header & View Toggle */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Asset Vault</h2>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{findings.length + visuals.length + documents.length} Items</span>
          </div>
          
          <button 
            onClick={toggleViewMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${viewMode === 'technical' ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-indigo-700 border-indigo-200 shadow-sm'}`}
            title={viewMode === 'technical' ? "Switch to Professional Reader View" : "Switch to Technical Markup View"}
          >
             {viewMode === 'technical' ? <Code className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
             <span className="text-[9px] font-bold uppercase tracking-widest">{viewMode === 'technical' ? 'Markup' : 'Reader'}</span>
          </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white scrollbar-hide sticky top-0 z-10 shadow-sm">
        <TabButton id="analysis" icon={Scale} label="Findings" />
        <TabButton id="visuals" icon={Image} label="Evidence" />
        <TabButton id="documents" icon={FileText} label="Docs" />
        <TabButton id="graph" icon={Network} label="Graph" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/50">
        
        {/* ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in fade-in">
            {summary && (
              <div className={`transition-all duration-500 ${viewMode === 'technical' ? 'glass-panel p-4 border-l-4 border-l-indigo-500 font-mono text-xs' : 'bg-white p-6 shadow-md border border-slate-100 font-serif'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`uppercase tracking-widest ${viewMode === 'technical' ? 'text-indigo-600 font-bold text-[10px]' : 'text-slate-900 font-bold text-sm border-b-2 border-slate-900 pb-1'}`}>Case Abstract</h3>
                    {viewMode === 'technical' && <span className="text-[9px] text-slate-400 font-mono">ID: {summary.incidentType.replace(/\s/g, '_').toUpperCase()}</span>}
                </div>
                
                <div className={`grid grid-cols-2 gap-4 mb-4 ${viewMode === 'technical' ? 'text-[10px]' : 'text-sm'}`}>
                    <div>
                        <span className={`block uppercase ${viewMode === 'technical' ? 'text-slate-400 font-bold' : 'text-slate-500 italic'}`}>Incident</span>
                        <span className="block text-slate-900 font-medium">{summary.incidentType}</span>
                    </div>
                    <div>
                        <span className={`block uppercase ${viewMode === 'technical' ? 'text-slate-400 font-bold' : 'text-slate-500 italic'}`}>Jurisdiction</span>
                        <span className="block text-slate-900 font-medium">{summary.jurisdiction}</span>
                    </div>
                </div>
                
                <p className={`leading-relaxed ${viewMode === 'technical' ? 'text-slate-600' : 'text-slate-800 text-base'}`}>{summary.synopsis}</p>
                
                {summary.tags && (
                   <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                       {summary.tags.map((tag, i) => (
                           <span key={i} className={`px-2 py-1 rounded-full uppercase font-medium flex items-center gap-1 ${viewMode === 'technical' ? 'bg-slate-100 text-slate-500 text-[9px] font-mono border border-slate-200' : 'bg-indigo-50 text-indigo-700 text-[10px] border border-indigo-100'}`}>
                               <Tag className="w-2 h-2" /> {tag}
                           </span>
                       ))}
                   </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {findings.map((findingGroup) => (
                <div key={findingGroup.id} className={`transition-all duration-500 group ${viewMode === 'technical' ? 'bg-white border border-slate-300 rounded shadow-[4px_4px_0px_rgba(0,0,0,0.1)]' : 'bg-white border border-slate-200 shadow-sm rounded-lg hover:shadow-md'}`}>
                   
                   {/* Finding Header */}
                   <div className={`flex items-center justify-between p-3 ${viewMode === 'technical' ? 'bg-slate-100 border-b border-slate-300' : 'border-b border-slate-50'}`}>
                       <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${viewMode === 'technical' ? 'bg-indigo-600 animate-pulse' : 'bg-indigo-500'}`}></div>
                           <h4 className={`uppercase ${viewMode === 'technical' ? 'font-mono text-[10px] font-bold text-slate-700' : 'font-sans text-xs font-bold text-indigo-900'}`}>{findingGroup.title}</h4>
                       </div>
                       <span className={`flex items-center gap-1 ${viewMode === 'technical' ? 'font-mono text-[9px] text-slate-400' : 'text-[10px] text-slate-400 italic'}`}>
                           <Clock className="w-3 h-3" />
                           {new Date(findingGroup.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </span>
                   </div>

                   {/* Finding Items */}
                   <div className="p-4">
                       <ul className={`space-y-3 ${viewMode === 'technical' ? 'list-none' : 'list-none'}`}>
                           {findingGroup.items.map((item, idx) => (
                               <li key={idx} className={`relative ${viewMode === 'technical' ? 'pl-4 font-mono text-[10px] text-slate-600 border-l border-indigo-200' : 'text-sm text-slate-700 leading-relaxed pl-0'}`}>
                                   {viewMode === 'technical' && <span className="absolute left-0 top-0 -ml-[1px] w-2 h-[1px] bg-indigo-400"></span>}
                                   {viewMode === 'reader' && <span className="inline-block w-1.5 h-1.5 bg-indigo-300 rounded-full mr-2 align-middle"></span>}
                                   {item}
                               </li>
                           ))}
                       </ul>
                   </div>
                </div>
              ))}
              {findings.length === 0 && <p className="text-xs text-slate-400 italic p-4 text-center border-2 border-dashed border-slate-200 rounded">No findings recorded. Run an analysis protocol.</p>}
            </div>

            {precedents.length > 0 && <SearchResults results={precedents} />}
          </div>
        )}

        {/* VISUALS TAB */}
        {activeTab === 'visuals' && (
          <div className="space-y-8 animate-in fade-in">
            {visuals.length > 0 ? visuals.map((content) => (
               <div key={content.id} className="border-b border-slate-200 pb-8 last:border-0">
                   {/* Pass view mode implicitly via infographic, or explicitly if updated */}
                   <Infographic content={content} onEdit={onEditVisual} isEditing={false} />
               </div>
            )) : (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                   <Image className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-xs uppercase tracking-widest font-bold">No Visuals Generated</p>
                   <p className="text-[10px] mt-2">Try command: <span className="font-mono bg-slate-100 px-1 rounded">/visualize</span></p>
               </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
           <div className="space-y-4 animate-in fade-in">
              {documents.length > 0 ? documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`transition-all duration-300 cursor-pointer group overflow-hidden ${
                        viewMode === 'technical' 
                        ? 'bg-slate-900 text-slate-300 border border-slate-700 rounded font-mono' 
                        : 'bg-white text-slate-800 border border-slate-200 shadow-sm hover:shadow-md rounded-lg'
                    }`}
                    onClick={() => setSelectedDoc(selectedDoc === doc.id ? null : doc.id)}
                  >
                      {/* Doc Header */}
                      <div className={`flex items-center justify-between p-3 ${viewMode === 'technical' ? 'bg-slate-950 border-b border-slate-800' : 'bg-slate-50 border-b border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                              <FileText className={`w-4 h-4 ${viewMode === 'technical' ? 'text-green-500' : 'text-indigo-600'}`} />
                              <span className={`text-xs font-bold uppercase tracking-wider ${viewMode === 'technical' ? 'text-green-400' : 'text-slate-800'}`}>{doc.title}</span>
                          </div>
                          <span className={`text-[9px] uppercase ${viewMode === 'technical' ? 'text-slate-600' : 'text-slate-400'}`}>{doc.type}</span>
                      </div>
                      
                      {/* Doc Preview / Full Content */}
                      {selectedDoc === doc.id ? (
                          <div className={`p-4 ${viewMode === 'technical' ? 'bg-slate-900 text-xs' : 'bg-white'}`}>
                              <div className={`whitespace-pre-wrap leading-relaxed ${viewMode === 'technical' ? 'font-mono text-slate-300' : 'font-serif text-sm text-slate-800'}`}>
                                {doc.content}
                              </div>
                              <div className={`flex justify-end mt-4 pt-3 gap-2 ${viewMode === 'technical' ? 'border-t border-slate-800' : 'border-t border-slate-100'}`}>
                                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(doc.content); }} className={`p-1.5 rounded transition-colors ${viewMode === 'technical' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Copy"><Clipboard className="w-3 h-3" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); }} className={`p-1.5 rounded transition-colors ${viewMode === 'technical' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`} title="Download"><Download className="w-3 h-3" /></button>
                              </div>
                          </div>
                      ) : (
                          <div className="p-3">
                              <p className={`text-xs line-clamp-3 ${viewMode === 'technical' ? 'text-slate-500 font-mono' : 'text-slate-500 font-sans'}`}>
                                  {doc.content}
                              </p>
                              <div className="mt-2 text-[9px] text-center text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Click to Expand</div>
                          </div>
                      )}
                  </div>
              )) : (
                 <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                   <FileText className="w-12 h-12 mb-3 opacity-20" />
                   <p className="text-xs uppercase tracking-widest font-bold">No Documents Drafted</p>
                   <p className="text-[10px] mt-2">Try command: <span className="font-mono bg-slate-100 px-1 rounded">/draft memo</span></p>
               </div>
              )}
           </div>
        )}

        {/* GRAPH TAB */}
        {activeTab === 'graph' && (
            <div className={`h-[600px] animate-in fade-in relative rounded-lg overflow-hidden border ${viewMode === 'technical' ? 'border-indigo-900 bg-slate-950' : 'border-slate-200 bg-white shadow-sm'}`}>
                {mindMapData ? (
                    <MindMap data={mindMapData} onNodeClick={onNodeClick} onClose={() => {}} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
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

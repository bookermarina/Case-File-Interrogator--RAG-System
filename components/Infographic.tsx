/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GeneratedContent } from '../types';
import { Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut, Video, FileText, ChevronDown } from 'lucide-react';

interface InfographicProps {
  content: GeneratedContent;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
}

const Infographic: React.FC<InfographicProps> = ({ content, onEdit, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
  };

  const isVideo = content.type === 'video';

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-in fade-in slide-in-up duration-700 mt-8">
      
      {/* 1. TEXT ANALYSIS REPORT */}
      <div className="w-full glass-panel rounded-xl p-8 shadow-2xl relative">
         <div className="absolute -top-10 -right-10 p-10 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
         <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
             <FileText className="w-32 h-32 text-cyan-100" />
         </div>
         
         <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
             <div className="p-2 bg-slate-950/50 rounded border border-slate-700 text-cyan-400">
                <FileText className="w-4 h-4" />
             </div>
             <h3 className="text-cyan-400 font-mono text-xs uppercase tracking-[0.2em] text-glow-sm">
                Interrogation Report // Automated Findings
             </h3>
         </div>
         
         <div className="prose prose-invert max-w-none">
             <p className="text-slate-300 leading-relaxed whitespace-pre-line font-mono text-sm md:text-base pl-4 border-l-2 border-cyan-900/50">
                 {content.answer || "No text analysis available."}
             </p>
         </div>
      </div>

      {/* 2. VISUAL EVIDENCE */}
      <div className="relative group w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        <div className="absolute top-5 left-5 z-20 bg-slate-950/80 backdrop-blur border border-slate-700/50 px-4 py-1.5 rounded-full text-[10px] text-cyan-400 font-mono uppercase tracking-widest shadow-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
            Evidence Visualization
        </div>

        {isVideo ? (
            <video 
                src={content.data} 
                controls 
                autoPlay 
                loop 
                className="w-full h-auto max-h-[75vh] bg-black relative z-10"
            />
        ) : (
            <img 
                src={content.data} 
                alt="Evidence Visualization" 
                onClick={() => setIsFullscreen(true)}
                className="w-full h-auto object-contain max-h-[75vh] bg-slate-950 relative z-10 cursor-zoom-in opacity-95 hover:opacity-100 transition-opacity duration-300"
            />
        )}
        
        {/* Actions */}
        <div className="absolute top-5 right-5 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-30 translate-y-[-10px] md:translate-y-0">
          {!isVideo && (
            <button 
                onClick={() => setIsFullscreen(true)}
                className="bg-slate-900/90 text-white p-2.5 rounded-lg border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-lg backdrop-blur-sm"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <a 
            href={content.data} 
            download={`evidence-${content.id}.${isVideo ? 'mp4' : 'png'}`}
            className="bg-slate-900/90 text-white p-2.5 rounded-lg border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-lg backdrop-blur-sm"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 3. EDIT BAR */}
      <div className="w-full glass-panel rounded-xl p-3 flex items-center gap-3">
            <div className={`pl-4 ${isVideo ? 'text-red-500' : 'text-cyan-500'}`}>
                {isVideo ? <Video className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder={isVideo ? "Refine reconstruction (e.g. 'Zoom in on the door')..." : "Refine evidence visual (e.g. 'Add measurement annotations')..."}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 font-mono text-sm py-3"
                    disabled={isEditing}
                />
                <button
                    type="submit"
                    disabled={isEditing || !editPrompt.trim()}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg ${
                        isEditing || !editPrompt.trim() 
                        ? 'bg-slate-800 text-slate-600 shadow-none' 
                        : (isVideo ? 'bg-red-900/60 text-red-100 hover:bg-red-800 border border-red-500/30' : 'bg-cyan-900/60 text-cyan-100 hover:bg-cyan-800 border border-cyan-500/30')
                    }`}
                >
                    {isEditing ? "Processing..." : (isVideo ? "Update Video" : "Enhance Visual")}
                </button>
            </form>
      </div>

      <div className="text-center mt-2">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest opacity-70">
            QUERY HASH: "{content.prompt.substring(0, 50)}{content.prompt.length > 50 ? '...' : ''}"
        </p>
      </div>

      {/* Fullscreen Modal (Image Only) */}
      {isFullscreen && !isVideo && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                <div className="flex gap-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-700">
                    <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.5))} className="p-2.5 hover:bg-slate-800 text-slate-300 rounded hover:text-white transition-colors"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => setZoomLevel(z => Math.min(4, z + 0.5))} className="p-2.5 hover:bg-slate-800 text-slate-300 rounded hover:text-white transition-colors"><ZoomIn className="w-4 h-4" /></button>
                </div>
                <button onClick={() => { setIsFullscreen(false); setZoomLevel(1); }} className="p-3 bg-slate-900 border border-slate-700 text-white rounded-full hover:bg-slate-800 hover:border-cyan-500 transition-all shadow-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                <img 
                    src={content.data} 
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                    className="max-w-full max-h-full object-contain shadow-2xl"
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default Infographic;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedContent } from '../types';
import { Download, Edit3, Maximize2, X, ZoomIn, ZoomOut, Video, FileText, Code, AlignLeft, Eye, Move, MousePointerClick, Trash2, Crosshair } from 'lucide-react';

interface InfographicProps {
  content: GeneratedContent;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
}

const Infographic: React.FC<InfographicProps> = ({ content, onEdit, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewMode, setViewMode] = useState<'technical' | 'reader'>('technical');
  
  // Interactive State
  const [interactionMode, setInteractionMode] = useState<'pan' | 'highlight'>('pan');
  const [highlights, setHighlights] = useState<{id: number, x: number, y: number}[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Reset interactive state when content changes
  useEffect(() => {
      setHighlights([]);
      setPan({ x: 0, y: 0 });
      setZoomLevel(1);
  }, [content.id]);

  // Reset pan/zoom when closing fullscreen, but keep highlights
  useEffect(() => {
      if (!isFullscreen) {
          setPan({ x: 0, y: 0 });
          setZoomLevel(1);
      }
  }, [isFullscreen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!imageContainerRef.current || isVideo) return;
      
      if (interactionMode === 'highlight') {
          const rect = imageContainerRef.current.getBoundingClientRect();
          // Calculate relative position 0-100%
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setHighlights([...highlights, { id: Date.now(), x, y }]);
      } else {
          setIsDragging(true);
          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging && interactionMode === 'pan') {
          e.preventDefault();
          setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const removeHighlight = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      setHighlights(highlights.filter(h => h.id !== id));
  };

  const isVideo = content.type === 'video';

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto animate-in fade-in slide-in-up duration-700 mt-8 mb-12">
      
      {/* 1. TEXT ANALYSIS REPORT */}
      <div className={`w-full rounded-xl p-8 shadow-2xl relative transition-all duration-500 ease-in-out ${viewMode === 'technical' ? 'glass-panel' : 'bg-slate-900 border border-slate-800'}`}>
         
         {/* Background Effects (Technical Mode Only) */}
         <div className={`absolute -top-10 -right-10 p-10 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${viewMode === 'technical' ? 'opacity-100' : 'opacity-0'}`}></div>
         <div className={`absolute top-0 right-0 p-6 pointer-events-none transition-opacity duration-500 ${viewMode === 'technical' ? 'opacity-5' : 'opacity-0'}`}>
             <FileText className="w-32 h-32 text-cyan-100" />
         </div>

         {/* View Toggle */}
         <div className="absolute top-6 right-6 flex items-center gap-1 z-20 bg-slate-950/50 p-1 rounded-lg border border-slate-800">
            <button 
                onClick={() => setViewMode('technical')}
                className={`p-2 rounded transition-all duration-300 ${viewMode === 'technical' ? 'bg-cyan-950 text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                title="Technical View (Raw Data)"
            >
                <Code className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setViewMode('reader')}
                className={`p-2 rounded transition-all duration-300 ${viewMode === 'reader' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                title="Reader View (Document)"
            >
                <AlignLeft className="w-4 h-4" />
            </button>
         </div>
         
         {/* Header */}
         <div className={`flex items-center gap-3 mb-6 border-b pb-4 transition-all duration-500 ${viewMode === 'technical' ? 'border-slate-700/50' : 'border-slate-800'}`}>
             <div className={`p-2 rounded border transition-colors duration-500 ${viewMode === 'technical' ? 'bg-slate-950/50 border-slate-700 text-cyan-400' : 'bg-white/5 border-white/10 text-white'}`}>
                <FileText className="w-4 h-4" />
             </div>
             <h3 className={`transition-all duration-500 ${viewMode === 'technical' ? 'text-cyan-400 font-mono text-xs uppercase tracking-[0.2em] text-glow-sm' : 'text-white font-serif text-lg tracking-wide'}`}>
                {viewMode === 'technical' ? 'Interrogation Report // Automated Findings' : 'Legal Analysis Memorandum'}
             </h3>
         </div>
         
         {/* Content */}
         <div className="prose prose-invert max-w-none">
             <div className={`transition-all duration-500 ease-in-out ${viewMode === 'technical' ? 'font-mono text-sm text-slate-300 border-l-2 border-cyan-900/50 pl-4' : 'font-sans text-base md:text-lg text-slate-200 leading-relaxed'}`}>
                 <p className="whitespace-pre-line">
                     {content.answer || "No text analysis available."}
                 </p>
             </div>
         </div>
      </div>

      {/* 2. VISUAL EVIDENCE */}
      <div className="relative group w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-2xl transition-all duration-500 hover:shadow-cyan-900/10">
        
        {/* Exhibit Label */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-4 pointer-events-none">
            <div className="bg-slate-950/90 backdrop-blur border border-slate-700 px-4 py-2 text-[10px] text-white font-serif font-bold uppercase tracking-widest shadow-lg">
                Exhibit A
            </div>
            {viewMode === 'technical' && (
                <div className="bg-slate-950/80 backdrop-blur border border-slate-700/50 px-3 py-1.5 rounded-full text-[9px] text-cyan-400 font-mono uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
                    Evidence Visualization
                </div>
            )}
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
            <div className="relative">
                <img 
                    src={content.data} 
                    alt="Evidence Visualization" 
                    onClick={() => setIsFullscreen(true)}
                    className="w-full h-auto object-contain max-h-[75vh] bg-slate-950 relative z-10 cursor-zoom-in opacity-95 hover:opacity-100 transition-opacity duration-300"
                />
                {/* Highlights Overlay (Small preview) */}
                {highlights.map(h => (
                    <div 
                        key={h.id}
                        className="absolute w-3 h-3 border-2 border-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] z-20 pointer-events-none"
                        style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
                    ></div>
                ))}
            </div>
        )}
        
        {/* Actions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-end justify-end gap-2">
          {!isVideo && (
            <button 
                onClick={() => setIsFullscreen(true)}
                className="bg-slate-900 text-white p-2 rounded-lg border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-lg"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <a 
            href={content.data} 
            download={`evidence-${content.id}.${isVideo ? 'mp4' : 'png'}`}
            className="bg-slate-900 text-white p-2 rounded-lg border border-slate-700 hover:border-cyan-500 hover:text-cyan-400 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 3. EDIT BAR */}
      <div className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all duration-500 ${viewMode === 'technical' ? 'glass-panel' : 'bg-slate-900 border border-slate-800'}`}>
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

      {/* INTERACTIVE ANALYSIS VIEW (Fullscreen) */}
      {isFullscreen && !isVideo && (
        <div 
            className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in duration-300"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-4">
                    {/* Zoom Controls */}
                    <div className="flex gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-700 shadow-xl">
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-2.5 hover:bg-slate-800 text-slate-300 rounded hover:text-white transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                        <span className="flex items-center justify-center w-12 text-xs font-mono text-cyan-400 border-l border-r border-slate-800">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))} className="p-2.5 hover:bg-slate-800 text-slate-300 rounded hover:text-white transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    </div>

                    {/* Interaction Mode Toggle */}
                    <div className="flex gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-700 shadow-xl">
                         <button 
                            onClick={() => setInteractionMode('pan')}
                            className={`p-2.5 rounded transition-colors flex items-center gap-2 ${interactionMode === 'pan' ? 'bg-cyan-950 text-cyan-400' : 'hover:bg-slate-800 text-slate-300'}`}
                            title="Pan Mode (Drag to move)"
                         >
                            <Move className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Pan</span>
                         </button>
                         <button 
                            onClick={() => setInteractionMode('highlight')}
                            className={`p-2.5 rounded transition-colors flex items-center gap-2 ${interactionMode === 'highlight' ? 'bg-cyan-950 text-cyan-400' : 'hover:bg-slate-800 text-slate-300'}`}
                            title="Highlight Mode (Click to mark)"
                         >
                            <Crosshair className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Mark</span>
                         </button>
                    </div>

                    <div className="bg-slate-900/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-700 text-[10px] text-slate-400 font-mono uppercase hidden md:block">
                        {interactionMode === 'pan' ? 'DRAG TO NAVIGATE' : 'CLICK TO ADD MARKER'}
                    </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <button 
                        onClick={() => { setHighlights([]); }} 
                        className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg hover:bg-red-900/50 transition-all shadow-lg mr-2"
                        title="Clear All Highlights"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => { setIsFullscreen(false); }} 
                        className="p-3 bg-slate-900 border border-slate-700 text-white rounded-full hover:bg-slate-800 hover:border-cyan-500 transition-all shadow-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Interactive Workspace */}
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-950 relative cursor-crosshair">
                <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-[length:40px_40px] pointer-events-none"></div>
                
                <div 
                    className={`relative transition-transform duration-100 ease-out origin-center ${interactionMode === 'pan' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}`}
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                    }}
                    onMouseDown={handleMouseDown}
                    ref={imageContainerRef}
                >
                    <img 
                        src={content.data} 
                        className="max-w-none shadow-2xl pointer-events-none select-none"
                        style={{ maxHeight: '80vh', maxWidth: '80vw' }} // Initial sizing constrain
                        draggable={false}
                    />
                    
                    {/* Render Highlights */}
                    {highlights.map((h, idx) => (
                        <div 
                            key={h.id}
                            className="absolute group z-10"
                            style={{ left: `${h.x}%`, top: `${h.y}%` }}
                        >
                            {/* Marker Icon */}
                            <div className="w-6 h-6 -translate-x-1/2 -translate-y-1/2 text-cyan-400 animate-in zoom-in duration-300">
                                <div className="absolute inset-0 bg-cyan-500/30 rounded-full animate-ping"></div>
                                <div className="absolute inset-1.5 bg-cyan-950 border border-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.8)] flex items-center justify-center text-[8px] font-bold text-white">
                                    {idx + 1}
                                </div>
                            </div>
                            
                            {/* Hover Tooltip / Delete */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap flex items-center gap-2 pointer-events-auto">
                                <span className="font-mono">MARKER #{idx + 1}</span>
                                <button onClick={(e) => removeHighlight(e, h.id)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Infographic;

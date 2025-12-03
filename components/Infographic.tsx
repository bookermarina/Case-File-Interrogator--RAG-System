
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
      <div className={`w-full rounded-xl p-8 shadow-sm relative transition-all duration-500 ease-in-out ${viewMode === 'technical' ? 'bg-white border border-slate-200' : 'bg-slate-50 border border-slate-200'}`}>
         
         {/* View Toggle */}
         <div className="absolute top-6 right-6 flex items-center gap-1 z-20 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <button 
                onClick={() => setViewMode('technical')}
                className={`p-2 rounded transition-all duration-300 ${viewMode === 'technical' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Technical View (Raw Data)"
            >
                <Code className="w-4 h-4" />
            </button>
            <button 
                onClick={() => setViewMode('reader')}
                className={`p-2 rounded transition-all duration-300 ${viewMode === 'reader' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Reader View (Document)"
            >
                <AlignLeft className="w-4 h-4" />
            </button>
         </div>
         
         {/* Header */}
         <div className={`flex items-center gap-3 mb-6 border-b pb-4 transition-all duration-500 ${viewMode === 'technical' ? 'border-slate-100' : 'border-slate-200'}`}>
             <div className={`p-2 rounded border transition-colors duration-500 ${viewMode === 'technical' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                <FileText className="w-4 h-4" />
             </div>
             <h3 className={`transition-all duration-500 ${viewMode === 'technical' ? 'text-indigo-600 font-mono text-xs uppercase tracking-[0.2em]' : 'text-slate-800 font-serif text-lg tracking-wide'}`}>
                {viewMode === 'technical' ? 'Interrogation Report // Automated Findings' : 'Legal Analysis Memorandum'}
             </h3>
         </div>
         
         {/* Content */}
         <div className="prose prose-slate max-w-none">
             <div className={`transition-all duration-500 ease-in-out ${viewMode === 'technical' ? 'font-mono text-sm text-slate-600 border-l-2 border-indigo-100 pl-4' : 'font-sans text-base md:text-lg text-slate-800 leading-relaxed'}`}>
                 <p className="whitespace-pre-line">
                     {content.answer || "No text analysis available."}
                 </p>
             </div>
         </div>
      </div>

      {/* 2. VISUAL EVIDENCE */}
      <div className="relative group w-full bg-white rounded-lg overflow-hidden border border-slate-200 shadow-lg transition-all duration-500 hover:shadow-xl">
        
        {/* Exhibit Label */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-4 pointer-events-none">
            <div className="bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 text-[10px] text-slate-800 font-serif font-bold uppercase tracking-widest shadow-sm">
                Exhibit A
            </div>
            {viewMode === 'technical' && (
                <div className="bg-white/90 backdrop-blur border border-indigo-100 px-3 py-1.5 rounded-full text-[9px] text-indigo-600 font-mono uppercase tracking-widest shadow-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
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
            <div className="relative bg-slate-100">
                <img 
                    src={content.data} 
                    alt="Evidence Visualization" 
                    onClick={() => setIsFullscreen(true)}
                    className="w-full h-auto object-contain max-h-[75vh] relative z-10 cursor-zoom-in opacity-95 hover:opacity-100 transition-opacity duration-300 mix-blend-multiply"
                />
                {/* Highlights Overlay (Small preview) */}
                {highlights.map(h => (
                    <div 
                        key={h.id}
                        className="absolute w-3 h-3 border-2 border-indigo-500 rounded-full shadow-sm z-20 pointer-events-none bg-indigo-500/20"
                        style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
                    ></div>
                ))}
            </div>
        )}
        
        {/* Actions Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 flex items-end justify-end gap-2">
          {!isVideo && (
            <button 
                onClick={() => setIsFullscreen(true)}
                className="bg-white text-slate-700 p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-md"
            >
                <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <a 
            href={content.data} 
            download={`evidence-${content.id}.${isVideo ? 'mp4' : 'png'}`}
            className="bg-white text-slate-700 p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 3. EDIT BAR */}
      <div className={`w-full rounded-xl p-3 flex items-center gap-3 transition-all duration-500 ${viewMode === 'technical' ? 'bg-white border border-slate-200' : 'bg-slate-50 border border-slate-200'}`}>
            <div className={`pl-4 ${isVideo ? 'text-red-500' : 'text-indigo-500'}`}>
                {isVideo ? <Video className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex gap-3">
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder={isVideo ? "Refine reconstruction (e.g. 'Zoom in on the door')..." : "Refine evidence visual (e.g. 'Add measurement annotations')..."}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-mono text-sm py-3"
                    disabled={isEditing}
                />
                <button
                    type="submit"
                    disabled={isEditing || !editPrompt.trim()}
                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm ${
                        isEditing || !editPrompt.trim() 
                        ? 'bg-slate-100 text-slate-400 shadow-none' 
                        : (isVideo ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200')
                    }`}
                >
                    {isEditing ? "Processing..." : (isVideo ? "Update Video" : "Enhance Visual")}
                </button>
            </form>
      </div>

      {/* INTERACTIVE ANALYSIS VIEW (Fullscreen) */}
      {isFullscreen && !isVideo && (
        <div 
            className="fixed inset-0 z-[200] bg-white flex flex-col animate-in fade-in duration-300"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-white/90 backdrop-blur border-b border-slate-200 shadow-sm">
                <div className="pointer-events-auto flex items-center gap-4">
                    {/* Zoom Controls */}
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-2 hover:bg-white text-slate-500 rounded hover:text-indigo-600 transition-colors" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                        <span className="flex items-center justify-center w-12 text-xs font-mono text-slate-700 border-l border-r border-slate-200 bg-white">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(z => Math.min(4, z + 0.25))} className="p-2 hover:bg-white text-slate-500 rounded hover:text-indigo-600 transition-colors" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                    </div>

                    {/* Interaction Mode Toggle */}
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                         <button 
                            onClick={() => setInteractionMode('pan')}
                            className={`p-2 rounded transition-colors flex items-center gap-2 ${interactionMode === 'pan' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="Pan Mode (Drag to move)"
                         >
                            <Move className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Pan</span>
                         </button>
                         <button 
                            onClick={() => setInteractionMode('highlight')}
                            className={`p-2 rounded transition-colors flex items-center gap-2 ${interactionMode === 'highlight' ? 'bg-white text-indigo-600 shadow-sm' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="Highlight Mode (Click to mark)"
                         >
                            <Crosshair className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Mark</span>
                         </button>
                    </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                    <button 
                        onClick={() => { setHighlights([]); }} 
                        className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-lg hover:bg-red-100 transition-all mr-2 flex items-center gap-2 text-xs font-bold uppercase"
                        title="Clear All Highlights"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear Marks
                    </button>
                    <button 
                        onClick={() => { setIsFullscreen(false); }} 
                        className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Interactive Workspace */}
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-slate-50 relative cursor-crosshair">
                <div className="absolute inset-0 bg-grid-slate-200/[0.5] bg-[length:40px_40px] pointer-events-none"></div>
                
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
                        className="max-w-none shadow-2xl pointer-events-none select-none mix-blend-multiply"
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
                            <div className="w-6 h-6 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-in zoom-in duration-300">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                                <div className="absolute inset-1.5 bg-white border-2 border-indigo-600 rounded-full shadow-lg flex items-center justify-center text-[8px] font-bold text-indigo-700">
                                    {idx + 1}
                                </div>
                            </div>
                            
                            {/* Hover Tooltip / Delete */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-800 text-[10px] px-2 py-1 rounded border border-slate-200 whitespace-nowrap flex items-center gap-2 pointer-events-auto shadow-md">
                                <span className="font-mono font-bold">MARKER #{idx + 1}</span>
                                <button onClick={(e) => removeHighlight(e, h.id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
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
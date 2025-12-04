
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { MindMapData, MindMapNode } from '../types';
import { User, FileText, MapPin, AlertTriangle, Briefcase, ZoomIn, ZoomOut, Maximize2, X, MessageSquare, Tag, Quote } from 'lucide-react';

interface MindMapProps {
  data: MindMapData;
  onNodeClick: (node: MindMapNode) => void;
  onClose: () => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick, onClose }) => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Layout Algorithm: Radial
  useEffect(() => {
    if (!data || !data.nodes || !data.nodes.length) return;

    const width = 800;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clone nodes to avoid mutating props
    const processedNodes = data.nodes.map(n => ({ ...n }));
    const caseNode = processedNodes.find(n => n.type === 'case') || processedNodes[0];
    
    // Position center
    caseNode.x = centerX;
    caseNode.y = centerY;

    const otherNodes = processedNodes.filter(n => n.id !== caseNode.id);
    const radius = 220; // Increased radius for better spread
    const angleStep = (2 * Math.PI) / otherNodes.length;

    otherNodes.forEach((node, index) => {
      // Create a slight spiral/offset for variety
      const r = radius + (index % 2 === 0 ? 0 : 50);
      node.x = centerX + r * Math.cos(index * angleStep);
      node.y = centerY + r * Math.sin(index * angleStep);
    });

    setNodes(processedNodes);
  }, [data]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'person': return '#0ea5e9'; // sky-500
      case 'evidence': return '#ec4899'; // pink-500
      case 'location': return '#eab308'; // yellow-500
      case 'event': return '#ef4444'; // red-500
      case 'case': return '#334155'; // slate-700
      default: return '#64748b';
    }
  };

  const getNodeIcon = (type: string) => {
     switch (type) {
      case 'person': return User;
      case 'evidence': return FileText;
      case 'location': return MapPin;
      case 'event': return AlertTriangle;
      case 'case': return Briefcase;
      default: return FileText;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400">
        <Briefcase className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-xs uppercase tracking-widest mb-4">Empty Map Data</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded text-xs font-bold text-slate-600">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                <Maximize2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
                <h2 className="text-sm font-display font-bold text-slate-800 uppercase tracking-widest">Investigation Board</h2>
                <p className="text-[10px] text-slate-500 font-mono">Entity Relationship Graph</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-slate-100 rounded text-slate-500"><ZoomOut className="w-4 h-4"/></button>
            <span className="text-xs font-mono text-slate-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-100 rounded text-slate-500"><ZoomIn className="w-4 h-4"/></button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded text-slate-400"><X className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div 
            ref={containerRef}
            className={`flex-1 relative overflow-hidden bg-slate-50 cursor-move`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute inset-0 bg-grid-slate-200/[0.5] bg-[length:40px_40px] pointer-events-none"></div>
            
            <div 
                className="absolute inset-0 transition-transform duration-75 ease-out origin-center"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
                <svg width="100%" height="100%" className="overflow-visible">
                    {/* Edges */}
                    {data.edges && data.edges.map((edge, i) => {
                        const source = nodes.find(n => n.id === edge.source);
                        const target = nodes.find(n => n.id === edge.target);
                        if (!source || !target || !source.x || !target.x) return null;

                        return (
                            <g key={i}>
                                <line 
                                    x1={source.x} y1={source.y} 
                                    x2={target.x} y2={target.y} 
                                    stroke="#cbd5e1" 
                                    strokeWidth="2" 
                                    className="stroke-slate-300"
                                />
                                {/* Edge Label (Midpoint) */}
                                <rect 
                                    x={(source.x + target.x) / 2 - 20} 
                                    y={(source.y + target.y) / 2 - 8} 
                                    width="40" height="16" 
                                    fill="white" 
                                    rx="4"
                                    stroke="#e2e8f0"
                                />
                                <text 
                                    x={(source.x + target.x) / 2} 
                                    y={(source.y + target.y) / 2 + 3} 
                                    fill="#64748b" 
                                    fontSize="8" 
                                    textAnchor="middle" 
                                    className="font-mono uppercase tracking-wide"
                                >
                                    {edge.relation}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Nodes (HTML Overlay for interaction) */}
                {nodes.map((node) => {
                   if (!node.x || !node.y) return null;
                   const Icon = getNodeIcon(node.type);
                   const isSelected = selectedNode?.id === node.id;

                   return (
                       <div 
                            key={node.id}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-all duration-300 ${isSelected ? 'z-50 scale-110' : 'z-10 hover:scale-105'}`}
                            style={{ left: node.x, top: node.y }}
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                       >
                           {/* Glow Effect */}
                           <div className={`absolute inset-0 rounded-full blur-md opacity-20 transition-all ${isSelected ? 'opacity-60 blur-lg scale-150' : 'group-hover:opacity-30'}`} style={{ backgroundColor: getNodeColor(node.type) }}></div>
                           
                           {/* Node Body */}
                           <div 
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white shadow-lg transition-colors`}
                                style={{ borderColor: isSelected ? getNodeColor(node.type) : '#cbd5e1' }}
                           >
                                <Icon className="w-5 h-5" style={{ color: getNodeColor(node.type) }} />
                           </div>

                           {/* Label */}
                           <div className={`absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm transition-all ${isSelected ? 'border-indigo-400 text-indigo-600 ring-2 ring-indigo-50' : ''}`}>
                               {node.label}
                           </div>
                       </div>
                   );
                })}
            </div>
        </div>

        {/* Sidebar Panel (Deep Dive) */}
        {selectedNode && (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col animate-in slide-in-right duration-300 shadow-xl z-20">
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedNode.type}</span>
                        <h3 className="text-xl font-display font-bold text-slate-800 mt-1">{selectedNode.label}</h3>
                        {selectedNode.metadata?.role && (
                             <span className="inline-block mt-2 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">{selectedNode.metadata.role}</span>
                        )}
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Description */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dossier</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-serif">
                            {selectedNode.description}
                        </p>
                    </div>

                    {/* Impact Score */}
                    {selectedNode.metadata?.impactScore && (
                        <div>
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                 <span>Case Relevance</span>
                                 <span className="text-indigo-600">{selectedNode.metadata.impactScore}/10</span>
                             </h4>
                             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedNode.metadata.impactScore * 10}%` }}></div>
                             </div>
                        </div>
                    )}

                    {/* Key Quote */}
                    {selectedNode.metadata?.keyQuote && (
                        <div className="bg-slate-50 p-3 rounded border-l-2 border-indigo-300">
                             <Quote className="w-3 h-3 text-indigo-300 mb-1" />
                             <p className="text-xs text-slate-700 italic">"{selectedNode.metadata.keyQuote}"</p>
                        </div>
                    )}

                    {/* Tags */}
                    {selectedNode.metadata?.tags && (
                        <div>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedNode.metadata.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-600 flex items-center gap-1">
                                        <Tag className="w-2 h-2" /> {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={() => onNodeClick(selectedNode)}
                        className="w-full btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Deep Dive Query</span>
                    </button>
                    <p className="text-[9px] text-slate-400 text-center mt-3 font-mono">
                        Sends entity context to Case Chat
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MindMap;

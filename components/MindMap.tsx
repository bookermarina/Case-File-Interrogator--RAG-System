/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { MindMapData, MindMapNode } from '../types';
import { User, FileText, MapPin, AlertTriangle, Briefcase, ZoomIn, ZoomOut, Maximize2, X, MessageSquare } from 'lucide-react';

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
    if (!data.nodes.length) return;

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
    const radius = 200;
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
      case 'person': return '#22d3ee'; // cyan-400
      case 'evidence': return '#f472b6'; // pink-400
      case 'location': return '#fbbf24'; // amber-400
      case 'event': return '#ef4444'; // red-500
      case 'case': return '#ffffff';
      default: return '#94a3b8';
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

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/50 rounded border border-cyan-500/30">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-sm font-display font-bold text-white uppercase tracking-widest text-glow-sm">Investigation Board</h2>
                <p className="text-[10px] text-slate-500 font-mono">Entity Relationship Graph</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-2 hover:bg-slate-800 rounded text-slate-400"><ZoomOut className="w-4 h-4"/></button>
            <span className="text-xs font-mono text-cyan-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-800 rounded text-slate-400"><ZoomIn className="w-4 h-4"/></button>
            <div className="w-px h-6 bg-slate-800 mx-2"></div>
            <button onClick={onClose} className="p-2 hover:bg-red-950/50 hover:text-red-400 rounded text-slate-400"><X className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div 
            ref={containerRef}
            className={`flex-1 relative overflow-hidden bg-slate-950 cursor-move`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-[length:40px_40px] pointer-events-none"></div>
            
            <div 
                className="absolute inset-0 transition-transform duration-75 ease-out origin-center"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
                <svg width="100%" height="100%" className="overflow-visible">
                    {/* Edges */}
                    {data.edges.map((edge, i) => {
                        const source = nodes.find(n => n.id === edge.source);
                        const target = nodes.find(n => n.id === edge.target);
                        if (!source || !target || !source.x || !target.x) return null;

                        return (
                            <g key={i}>
                                <line 
                                    x1={source.x} y1={source.y} 
                                    x2={target.x} y2={target.y} 
                                    stroke="#1e293b" 
                                    strokeWidth="2" 
                                    className="stroke-slate-800"
                                />
                                <line 
                                    x1={source.x} y1={source.y} 
                                    x2={target.x} y2={target.y} 
                                    stroke="url(#gradient-line)" 
                                    strokeWidth="1" 
                                    className="opacity-50"
                                />
                                {/* Edge Label (Midpoint) */}
                                <text 
                                    x={(source.x + target.x) / 2} 
                                    y={(source.y + target.y) / 2} 
                                    fill="#64748b" 
                                    fontSize="10" 
                                    textAnchor="middle" 
                                    className="font-mono bg-slate-950"
                                >
                                    {edge.relation}
                                </text>
                            </g>
                        );
                    })}
                    <defs>
                        <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                    </defs>
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
                           <div className={`absolute inset-0 rounded-full blur-md opacity-20 transition-all ${isSelected ? 'opacity-60 blur-lg scale-150' : 'group-hover:opacity-40'}`} style={{ backgroundColor: getNodeColor(node.type) }}></div>
                           
                           {/* Node Body */}
                           <div 
                                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-slate-950 shadow-xl transition-colors`}
                                style={{ borderColor: isSelected ? getNodeColor(node.type) : '#334155' }}
                           >
                                <Icon className="w-5 h-5" style={{ color: getNodeColor(node.type) }} />
                           </div>

                           {/* Label */}
                           <div className={`absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-300 transition-all ${isSelected ? 'border-cyan-500/50 text-cyan-400' : ''}`}>
                               {node.label}
                           </div>
                       </div>
                   );
                })}
            </div>
        </div>

        {/* Sidebar Panel (Deep Dive) */}
        {selectedNode && (
            <div className="w-80 bg-slate-900/80 border-l border-slate-800 p-6 flex flex-col animate-in slide-in-right duration-300 backdrop-blur-md">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedNode.type}</span>
                        <h3 className="text-xl font-display font-bold text-white mt-1">{selectedNode.label}</h3>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                </div>

                <div className="flex-1 overflow-y-auto mb-6">
                    <p className="text-sm text-slate-300 leading-relaxed font-mono border-l-2 border-slate-700 pl-4">
                        {selectedNode.description}
                    </p>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <button 
                        onClick={() => onNodeClick(selectedNode)}
                        className="w-full btn-primary py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Deep Dive Query</span>
                    </button>
                    <p className="text-[9px] text-slate-500 text-center mt-3 font-mono">
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
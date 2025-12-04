
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MindMapData, MindMapNode } from '../types';
import { User, FileText, MapPin, AlertTriangle, Briefcase, ZoomIn, ZoomOut, Maximize2, X, MessageSquare, Tag, Quote, RefreshCw, Grab } from 'lucide-react';

interface MindMapProps {
  data: MindMapData;
  onNodeClick: (node: MindMapNode) => void;
  onClose: () => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, onNodeClick, onClose }) => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  
  // Interaction State
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // --- PHYSICS ENGINE ---
  useEffect(() => {
    if (!data || !data.nodes || !data.nodes.length) {
        setNodes([]);
        return;
    }

    // 1. Initialize Nodes with random positions near center
    // We delay slightly to ensure container has dimensions, or default to reasonable fallback
    const width = containerRef.current?.clientWidth || window.innerWidth * 0.4 || 800;
    const height = containerRef.current?.clientHeight || window.innerHeight * 0.6 || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const initialNodes = data.nodes.map((n, i) => {
        // Spiral layout for initial spread to avoid stacking 
        const angle = 0.5 * i;
        const radius = 50 + 10 * i;
        return {
            ...n,
            x: n.x || centerX + Math.cos(angle) * radius,
            y: n.y || centerY + Math.sin(angle) * radius,
            vx: 0,
            vy: 0
        };
    });

    setNodes(initialNodes);

    // 2. Simulation Loop
    const simulate = () => {
        setNodes(prevNodes => {
            const newNodes = prevNodes.map(n => ({ ...n })); // Shallow copy for mutation in this frame
            
            // Tuned Physics Constants for "Breathing" Graph
            const repulsion = 200000;   // Strong push to spread nodes
            const k = 0.02;             // Weak spring to allow length
            const centerGravity = 0.002; // Very weak pull to center
            const damping = 0.80;       // Stability
            const maxVelocity = 15;     // Speed limit
            const idealLength = 100;    // Target edge length

            // Apply Forces
            newNodes.forEach((node, i) => {
                let fx = 0;
                let fy = 0;

                // A. Repulsion (Nodes push each other away)
                newNodes.forEach((other, j) => {
                    if (i === j) return;
                    const dx = node.x! - other.x!;
                    const dy = node.y! - other.y!;
                    let distSq = dx * dx + dy * dy;
                    if (distSq < 100) distSq = 100; // Prevent singularity / infinity
                    
                    const dist = Math.sqrt(distSq);
                    const force = repulsion / distSq;
                    
                    fx += (dx / dist) * force;
                    fy += (dy / dist) * force;
                });

                // B. Spring Tension (Connected nodes pull together)
                data.edges.forEach(edge => {
                    let otherNode = null;
                    if (edge.source === node.id) {
                        otherNode = newNodes.find(n => n.id === edge.target);
                    } else if (edge.target === node.id) {
                        otherNode = newNodes.find(n => n.id === edge.source);
                    }

                    if (otherNode) {
                        const dx = otherNode.x! - node.x!;
                        const dy = otherNode.y! - node.y!;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        // Hooke's Law with ideal length
                        // If dist > ideal, pull. If dist < ideal, push (optional, but simple spring usually just pulls)
                        const displacement = dist - idealLength;
                        const force = k * displacement; 
                        
                        if (dist > 0) {
                            fx += (dx / dist) * force;
                            fy += (dy / dist) * force;
                        }
                    }
                });

                // C. Center Gravity (Gentle drift to middle so it doesn't fly away)
                fx += (centerX - node.x!) * centerGravity;
                fy += (centerY - node.y!) * centerGravity;

                // D. Update Velocity & Position
                if (node.id !== draggedNodeId) { 
                    node.vx = (node.vx! + fx) * damping;
                    node.vy = (node.vy! + fy) * damping;

                    // Clamp velocity
                    if (node.vx! > maxVelocity) node.vx = maxVelocity;
                    if (node.vx! < -maxVelocity) node.vx = -maxVelocity;
                    if (node.vy! > maxVelocity) node.vy = maxVelocity;
                    if (node.vy! < -maxVelocity) node.vy = -maxVelocity;

                    node.x! += node.vx!;
                    node.y! += node.vy!;
                }
            });

            return newNodes;
        });

        animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
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

  // --- INTERACTION HANDLERS ---

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDraggingCanvas) {
          setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
      if (draggedNodeId) {
          // Update dragged node position directly in state to override physics
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
             const mouseX = (e.clientX - rect.left - pan.x) / zoom;
             const mouseY = (e.clientY - rect.top - pan.y) / zoom;
             
             setNodes(prev => prev.map(n => 
                 n.id === draggedNodeId ? { ...n, x: mouseX, y: mouseY, vx: 0, vy: 0 } : n
             ));
          }
      }
  };

  const handleMouseUp = () => {
      setIsDraggingCanvas(false);
      setDraggedNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation(); // Prevent canvas drag
      setDraggedNodeId(nodeId);
      setSelectedNode(nodes.find(n => n.id === nodeId) || null);
  };

  const hasData = data && data.nodes && data.nodes.length > 0;
  
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400">
        <Briefcase className="w-12 h-12 mb-3 opacity-20" />
        <p className="text-xs uppercase tracking-widest mb-4">No Map Data Available</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded text-xs font-bold text-slate-600">Close</button>
      </div>
    );
  }

  // Loading state
  if (nodes.length === 0) {
      return (
         <div className="flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400">
            <RefreshCw className="w-8 h-8 mb-3 animate-spin text-indigo-400" />
            <p className="text-xs uppercase tracking-widest">Constructing Neural Graph...</p>
         </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shadow-sm z-30">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded border border-indigo-200">
                <Maximize2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
                <h2 className="text-sm font-display font-bold text-slate-800 uppercase tracking-widest">Investigation Board</h2>
                <p className="text-[10px] text-slate-500 font-mono">Dynamic Force Graph ({nodes.length} Entities)</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-2 hover:bg-slate-100 rounded text-slate-500"><ZoomOut className="w-4 h-4"/></button>
            <span className="text-xs font-mono text-slate-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 hover:bg-slate-100 rounded text-slate-500"><ZoomIn className="w-4 h-4"/></button>
            <div className="w-px h-6 bg-slate-200 mx-2"></div>
            <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded text-slate-400"><X className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas */}
        <div 
            ref={containerRef}
            className={`flex-1 relative overflow-hidden bg-slate-50 ${isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="absolute inset-0 bg-grid-slate-200/[0.5] bg-[length:40px_40px] pointer-events-none"></div>
            
            <div 
                className="absolute inset-0 transition-transform duration-75 ease-linear origin-top-left"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
                <svg width="2000" height="2000" className="overflow-visible pointer-events-none">
                    {/* Edges */}
                    {data.edges && data.edges.map((edge, i) => {
                        const source = nodes.find(n => n.id === edge.source);
                        const target = nodes.find(n => n.id === edge.target);
                        if (!source || !target || !source.x || !target.x) return null;

                        return (
                            <g key={i} className="transition-all duration-75">
                                <line 
                                    x1={source.x} y1={source.y} 
                                    x2={target.x} y2={target.y} 
                                    stroke="#cbd5e1" 
                                    strokeWidth="1.5" 
                                    className="stroke-slate-300"
                                />
                                {/* Dynamic label placement */}
                                <text 
                                    x={(source.x + target.x) / 2} 
                                    y={(source.y + target.y) / 2 - 5} 
                                    fill="#94a3b8" 
                                    fontSize="8" 
                                    textAnchor="middle" 
                                    className="font-mono uppercase tracking-wide bg-white"
                                >
                                    {edge.relation}
                                </text>
                            </g>
                        );
                    })}
                </svg>

                {/* Nodes (Interactive) */}
                {nodes.map((node) => {
                   if (!node.x || !node.y) return null;
                   const Icon = getNodeIcon(node.type);
                   const isSelected = selectedNode?.id === node.id;
                   const isDraggingThis = draggedNodeId === node.id;

                   return (
                       <div 
                            key={node.id}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer`}
                            style={{ 
                                left: node.x, 
                                top: node.y,
                                zIndex: isSelected || isDraggingThis ? 50 : 10,
                                transition: isDraggingThis ? 'none' : 'transform 0.1s linear' // Smooth physics unless dragging
                            }}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                            onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                       >
                           {/* Glow Effect */}
                           <div className={`absolute inset-0 rounded-full blur-md opacity-0 transition-all ${isSelected ? 'opacity-40 blur-lg scale-150' : 'group-hover:opacity-20'}`} style={{ backgroundColor: getNodeColor(node.type) }}></div>
                           
                           {/* Node Body */}
                           <div 
                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all ${isSelected ? 'scale-125 border-4' : ''}`}
                                style={{ borderColor: isSelected ? getNodeColor(node.type) : '#cbd5e1' }}
                           >
                                <Icon className="w-4 h-4" style={{ color: getNodeColor(node.type) }} />
                           </div>

                           {/* Label - Only show if selected or hovered or zoom is high */}
                           <div className={`absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded bg-white/90 border border-slate-200 text-[9px] font-bold uppercase tracking-wider text-slate-700 shadow-sm transition-opacity pointer-events-none ${isSelected || zoom > 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                               {node.label}
                           </div>
                       </div>
                   );
                })}
            </div>
        </div>

        {/* Sidebar Panel (Deep Dive) - Floating right */}
        {selectedNode && (
            <div className="absolute top-16 right-0 bottom-0 w-80 bg-white border-l border-slate-200 flex flex-col animate-in slide-in-right duration-300 shadow-2xl z-40">
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

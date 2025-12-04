
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { CaseSource, CaseArtifact, ChatMessage, AnalysisDepth, CaseContextDetection } from './types';
import { 
  analyzeCaseFile, createCaseChat, detectCaseContext, 
  generateEvidenceVisual, generateLegalDocument, generateMindMapData, interrogateCaseFile 
} from './services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import SourcePanel from './components/SourcePanel';
import CaseStudio from './components/CaseStudio';
import IntroScreen from './components/IntroScreen';
import Infographic from './components/Infographic'; // Reusing for preview
import MindMap from './components/MindMap'; // Reusing for preview
import { Shield, Bot, User, Send, ChevronRight, X, Loader2, Download, Clipboard, Sparkles, Layout, PanelRightClose, PanelRightOpen, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  
  // --- STATE ---
  const [sources, setSources] = useState<CaseSource[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<CaseArtifact | null>(null);
  
  // Layout State
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  
  // Intelligence
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Context & Artifacts
  const [artifacts, setArtifacts] = useState<CaseArtifact[]>([]);
  const [contextData, setContextData] = useState<CaseContextDetection>({ 
      caseType: "Pending...", recommendedProtocols: [], reasoning: "" 
  });

  // API Key
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        setHasApiKey(await window.aistudio.hasSelectedApiKey());
      } else {
        setHasApiKey(true);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  useEffect(() => {
      if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatTyping]);

  // --- SOURCE MANAGEMENT ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setIsReadingFile(true);
          const newFiles: File[] = Array.from(e.target.files);
          
          let processedCount = 0;
          newFiles.forEach((file: File) => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  const newSource: CaseSource = {
                      id: Date.now().toString() + Math.random(),
                      name: file.name,
                      type: file.type.includes('pdf') ? 'pdf' : 'image',
                      mimeType: file.type,
                      base64: ev.target?.result as string,
                      timestamp: Date.now(),
                      isSelected: true // Auto-select new files
                  };
                  setSources(prev => [...prev, newSource]);
                  processedCount++;
                  if (processedCount === newFiles.length) {
                      setIsReadingFile(false);
                      // Context refresh is now handled by useEffect
                  }
              };
              reader.readAsDataURL(file);
          });
      }
  };

  const toggleSourceSelection = (id: string) => {
      setSources(prev => prev.map(s => s.id === id ? { ...s, isSelected: !s.isSelected } : s));
  };

  const removeSource = (id: string) => {
      setSources(prev => prev.filter(s => s.id !== id));
  };

  // --- INTELLIGENCE CORE ---
  
  // Automatic Context Refresh when Sources Change
  useEffect(() => {
    const initContext = async () => {
        if (!isReadingFile && sources.length > 0) {
            await refreshContext();
        }
    };
    initContext();
  }, [sources, isReadingFile]);

  const refreshContext = async () => {
      if (sources.length === 0) return;
      
      setIsChatTyping(true);
      
      // Auto-Detect Context
      try {
          const detection = await detectCaseContext(sources);
          setContextData(detection);
          
          // Re-initialize chat with new context AND Recommended Protocols
          // This tells the AI what it "suggested" so it can act on it later
          chatSessionRef.current = createCaseChat(sources, detection.recommendedProtocols);

          setChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `**Intelligence Updated**\nIdentified Context: ${detection.caseType}.\n\nI have calibrated the following analysis protocols based on the evidence:\n${detection.recommendedProtocols.map(p => `• ${p}`).join('\n')}\n\n${detection.reasoning}`,
              timestamp: Date.now()
          }]);
      } catch (error) {
          console.error("Context detection failed", error);
          chatSessionRef.current = createCaseChat(sources); // Fallback init
          setChatMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: "Sources uploaded. Ready for manual interrogation.",
              timestamp: Date.now()
          }]);
      } finally {
          setIsChatTyping(false);
      }
  };

  const runProtocol = async (protocol: string) => {
      // Execute an analysis protocol and create an artifact
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Executing Protocol: ${protocol}...`, timestamp: Date.now() }]);
      setIsChatTyping(true);
      
      try {
          // Special handling for different types
          if (protocol.includes('Visual') || protocol.includes('Sketch') || protocol.includes('Diagram')) {
             // Visual Flow
             let evidenceStyle: any = 'Technical Diagram';
             if (protocol.includes('Sketch')) evidenceStyle = 'Crime Scene Sketch';
             if (protocol.includes('Timeline')) evidenceStyle = 'Timeline Visualization';

             const result = await interrogateCaseFile(`Generate a ${protocol} based on the evidence.`, sources, 'Objective', evidenceStyle, 'English');
             const imgData = await generateEvidenceVisual(result.visualPrompt, '16:9', '1K');
             
             const newArtifact: CaseArtifact = {
                 id: Date.now().toString(),
                 title: protocol,
                 type: 'visual',
                 summary: result.answer.slice(0, 150) + "...",
                 data: { image: imgData, fullReport: result.answer },
                 timestamp: Date.now()
             };
             setArtifacts(prev => [newArtifact, ...prev]);
             setActiveArtifact(newArtifact); // Open Preview immediately
          } 
          else if (protocol.includes('Mind Map')) {
             const graph = await generateMindMapData(sources);
             const newArtifact: CaseArtifact = {
                 id: Date.now().toString(),
                 title: "Investigation Board",
                 type: 'mindmap',
                 summary: `Entity Graph with ${graph.nodes.length} nodes and ${graph.edges.length} connections.`,
                 data: graph,
                 timestamp: Date.now()
             };
             setArtifacts(prev => [newArtifact, ...prev]);
             setActiveArtifact(newArtifact);
          }
          else if (protocol.includes('Draft')) {
             // Document Drafting Flow
             // Expected Protocol: "Draft [Type]" or "Draft [Type] | [Instructions]"
             let docType = protocol.replace('Draft ', '');
             let instructions = '';
             
             if (docType.includes('|')) {
                 const parts = docType.split('|');
                 docType = parts[0].trim();
                 instructions = parts[1].trim();
             }

             const docContent = await generateLegalDocument(sources, docType, instructions);
             
             const newArtifact: CaseArtifact = {
                 id: Date.now().toString(),
                 title: docType,
                 type: 'document',
                 summary: `Drafted ${docType} ${instructions ? `with focus: ${instructions}` : 'based on evidence'}.`,
                 data: { content: docContent },
                 timestamp: Date.now()
             };
             setArtifacts(prev => [newArtifact, ...prev]);
             setActiveArtifact(newArtifact);
          }
          else {
              // Standard Text Analysis
              const result = await analyzeCaseFile(sources, protocol as AnalysisDepth);
              const newArtifact: CaseArtifact = {
                  id: Date.now().toString(),
                  title: protocol,
                  type: 'report',
                  summary: result.findings[0] || "Analysis complete.",
                  data: result,
                  timestamp: Date.now()
              };
              setArtifacts(prev => [newArtifact, ...prev]);
          }

          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Protocol Complete. New artifact '${protocol}' added to Studio.`, timestamp: Date.now() }]);
      } catch (e) {
          console.error(e);
          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error running protocol. Please check the console or try a smaller file.", timestamp: Date.now() }]);
      } finally {
          setIsChatTyping(false);
      }
  };

  const sendMessage = async () => {
      if (!chatInput.trim() || !chatSessionRef.current) return;
      
      const userMsg = chatInput;
      setChatInput('');
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg, timestamp: Date.now() }]);
      
      // --- SLASH COMMANDS ---
      if (userMsg.toLowerCase().startsWith('/draft')) {
          const raw = userMsg.slice(6).trim(); // Remove '/draft'
          // Format: "/draft Demand Letter: Focus on injury"
          const [docType, instr] = raw.includes(':') ? raw.split(':') : [raw, ''];
          
          runProtocol(`Draft ${docType || 'Legal Document'} | ${instr || ''}`);
          return;
      }
      
      setIsChatTyping(true);

      try {
          const result = await chatSessionRef.current.sendMessageStream({ message: userMsg });
          
          let fullText = '';
          const botId = Date.now().toString();
          setChatMessages(prev => [...prev, { id: botId, role: 'model', text: '', timestamp: Date.now() }]);

          for await (const chunk of result) {
              if (chunk.text) {
                  fullText += chunk.text;
                  setChatMessages(prev => prev.map(m => m.id === botId ? { ...m, text: fullText } : m));
              }
          }
          
          // --- POST-PROCESSING ---
          
          // 1. Extract Suggestions
          const suggestionRegex = /\/\/\/SUGGESTIONS\/\/\/(.*)/;
          const matchSuggestions = fullText.match(suggestionRegex);
          let extractedSuggestions: string[] = [];
          
          if (matchSuggestions && matchSuggestions[1]) {
              extractedSuggestions = matchSuggestions[1].split('|').map(s => s.trim());
              fullText = fullText.replace(suggestionRegex, ''); // Remove from displayed text
          }

          // 2. Extract Action Codes
          const actionRegex = /\[\[EXECUTE:(.*?)\]\]/g;
          let match;
          const actionsToRun = [];
          
          // Copy text for regex matching to avoid issues with mutation
          const textForActions = fullText; 
          while ((match = actionRegex.exec(textForActions)) !== null) {
              actionsToRun.push(match[1]);
          }
          
          fullText = fullText.replace(actionRegex, ''); // Remove actions from displayed text

          // 3. Update Message State with Cleaned Text & Suggestions
          setChatMessages(prev => prev.map(m => m.id === botId ? { 
              ...m, 
              text: fullText.trim(),
              suggestions: extractedSuggestions
          } : m));

          // 4. Trigger Actions
          if (actionsToRun.length > 0) {
              console.log("AI TRIGGERED ACTIONS:", actionsToRun);
              actionsToRun.forEach(protocol => runProtocol(protocol));
          }

      } catch (e) {
          console.error(e);
      } finally {
          setIsChatTyping(false);
      }
  };
  
  // Helper for suggestion clicks
  const sendSuggestion = (text: string) => {
      // Direct send logic bypassing chatInput state dependency for the initial trigger
      if (!chatSessionRef.current) return;
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: text, timestamp: Date.now() }]);
      setIsChatTyping(true);
      
      (async () => {
        try {
            const result = await chatSessionRef.current!.sendMessageStream({ message: text });
            let fullText = '';
            const botId = Date.now().toString();
            setChatMessages(prev => [...prev, { id: botId, role: 'model', text: '', timestamp: Date.now() }]);

            for await (const chunk of result) {
                if (chunk.text) {
                    fullText += chunk.text;
                    setChatMessages(prev => prev.map(m => m.id === botId ? { ...m, text: fullText } : m));
                }
            }
            
             // Extract Suggestions
            const suggestionRegex = /\/\/\/SUGGESTIONS\/\/\/(.*)/;
            const matchSuggestions = fullText.match(suggestionRegex);
            let extractedSuggestions: string[] = [];
            
            if (matchSuggestions && matchSuggestions[1]) {
                extractedSuggestions = matchSuggestions[1].split('|').map(s => s.trim());
                fullText = fullText.replace(suggestionRegex, '');
            }

            // Extract Action Codes
            const actionRegex = /\[\[EXECUTE:(.*?)\]\]/g;
            let match;
            const actionsToRun = [];
            const textForActions = fullText; 
            while ((match = actionRegex.exec(textForActions)) !== null) {
                actionsToRun.push(match[1]);
            }
            fullText = fullText.replace(actionRegex, '');

            setChatMessages(prev => prev.map(m => m.id === botId ? { 
                ...m, 
                text: fullText.trim(),
                suggestions: extractedSuggestions
            } : m));

            if (actionsToRun.length > 0) {
                actionsToRun.forEach(protocol => runProtocol(protocol));
            }
        } catch (e) { console.error(e); } 
        finally { setIsChatTyping(false); }
      })();
  };

  // --- RENDER ---
  if (showIntro) return <IntroScreen onComplete={() => setShowIntro(false)} />;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
        {!checkingKey && !hasApiKey && (
             <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"><button onClick={async () => { await window.aistudio.openSelectKey(); setHasApiKey(true); }} className="btn-primary px-8 py-4 rounded uppercase">Authenticate</button></div>
        )}

        {/* COLUMN 1: EVIDENCE LOCKER (Collapsible) */}
        <div className={`
            flex-shrink-0 bg-slate-50 border-r border-slate-200 z-20 transition-all duration-300 absolute md:static h-full shadow-lg md:shadow-none
            ${isLeftPanelOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden opacity-0 md:opacity-100'}
        `}>
            <div className="w-64 h-full"> {/* Inner wrapper to maintain width during transitions */}
                <SourcePanel 
                    sources={sources} 
                    onUpload={handleFileUpload} 
                    onRemove={removeSource} 
                    onToggleSelect={toggleSourceSelection} 
                    isReading={isReadingFile} 
                />
            </div>
        </div>

        {/* COLUMN 2: INTELLIGENCE STREAM (Main) */}
        <div className="flex-1 flex flex-col bg-white border-r border-slate-200 relative min-w-0">
             <header className="h-16 border-b border-slate-100 flex items-center px-4 md:px-6 justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)} className="md:hidden p-2 hover:bg-slate-100 rounded text-slate-500">
                        <Menu className="w-5 h-5" />
                    </button>
                    <Shield className="w-4 h-4 text-indigo-600 hidden sm:block" />
                    <span className="font-bold text-sm tracking-widest uppercase truncate">Interrogation Stream</span>
                </div>
                <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${chatSessionRef.current ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase hidden sm:inline">{chatSessionRef.current ? 'Online' : 'Offline'}</span>
                     </div>
                     <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                     <button 
                        onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                        className={`p-2 rounded-md transition-colors ${isRightPanelOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="Toggle Case Studio"
                     >
                        {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                     </button>
                </div>
             </header>
             
             <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
                 {sources.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
                         <Bot className="w-12 h-12 mb-4 opacity-20" />
                         <p className="text-sm font-medium">Waiting for evidence...</p>
                         <p className="text-xs">Upload files to the Evidence Locker to begin.</p>
                     </div>
                 ) : (
                    <>
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex flex-col gap-2 animate-in fade-in slide-in-up ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`flex gap-3 md:gap-4 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-100' : 'bg-indigo-600 text-white shadow-md'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 md:p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-white border border-slate-200' : 'bg-indigo-50 border border-indigo-100 text-slate-800'}`}>
                                        {/* Clean the text for display (hide action codes and suggestions if any remained) */}
                                        {msg.text.replace(/\[\[EXECUTE:.*?\]\]/g, '').replace(/\/\/\/SUGGESTIONS\/\/\/.*$/, '').trim()}
                                    </div>
                                </div>
                                
                                {/* Render Suggestions Chips if available */}
                                {msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 ml-12 max-w-[85%] animate-in fade-in delay-200">
                                        {msg.suggestions.map((s, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => sendSuggestion(s)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isChatTyping && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex items-center gap-1 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </>
                 )}
             </div>

             <div className="p-4 border-t border-slate-100 bg-white z-20">
                 <div className="relative">
                     <input 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Interrogate the evidence or /draft..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
                        disabled={sources.length === 0}
                     />
                     <button 
                        onClick={sendMessage} 
                        disabled={!chatInput.trim() || sources.length === 0}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         <Send className="w-4 h-4" />
                     </button>
                 </div>
                 <div className="px-1 pt-1 text-[10px] text-slate-400 font-mono">
                    Try: <span className="text-indigo-500">/draft Demand Letter: Focus on injury</span>
                 </div>
             </div>
        </div>

        {/* COLUMN 3: CASE STUDIO (Responsive) */}
        <div className={`
            flex-shrink-0 bg-slate-50 z-10 border-l border-slate-200 transition-all duration-300 ease-in-out
            ${isRightPanelOpen ? 'w-80 lg:w-96 translate-x-0' : 'w-0 translate-x-full overflow-hidden opacity-0'}
            absolute right-0 top-0 bottom-0 lg:static h-full shadow-2xl lg:shadow-none
        `}>
            <div className="w-80 lg:w-96 h-full"> {/* Inner wrapper */}
                <CaseStudio 
                    artifacts={artifacts} 
                    recommendedProtocols={contextData.recommendedProtocols}
                    onRunProtocol={runProtocol}
                    onOpenArtifact={setActiveArtifact}
                />
            </div>
        </div>

        {/* PREVIEW OVERLAY (FOCUS MODE) */}
        {activeArtifact && (
            <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col animate-in fade-in">
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded">
                             {/* Icon based on type */}
                             <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{activeArtifact.title}</h2>
                            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">{activeArtifact.type}</p>
                        </div>
                    </div>
                    <button onClick={() => setActiveArtifact(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-auto p-8 bg-slate-50 flex justify-center">
                    <div className="w-full max-w-5xl">
                        {activeArtifact.type === 'mindmap' && (
                             <div className="h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
                                 <MindMap data={activeArtifact.data} onNodeClick={() => {}} onClose={() => setActiveArtifact(null)} />
                             </div>
                        )}
                        {activeArtifact.type === 'visual' && (
                             <Infographic 
                                content={{ 
                                    id: activeArtifact.id, type: 'image', data: activeArtifact.data.image, 
                                    prompt: activeArtifact.title, answer: activeArtifact.data.fullReport, timestamp: Date.now() 
                                }} 
                                onEdit={() => {}} isEditing={false} 
                             />
                        )}
                        {activeArtifact.type === 'document' && (
                             <div className="bg-white p-10 shadow-lg rounded-xl border border-slate-200 max-w-3xl mx-auto">
                                <div className="flex justify-end mb-4 gap-2">
                                    <button onClick={() => navigator.clipboard.writeText(activeArtifact.data.content)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded border border-slate-200"><Clipboard className="w-3 h-3" /> Copy</button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded border border-slate-200"><Download className="w-3 h-3" /> Download</button>
                                </div>
                                <div className="prose prose-slate max-w-none whitespace-pre-wrap font-serif">
                                    {activeArtifact.data.content}
                                </div>
                             </div>
                        )}
                        {activeArtifact.type === 'report' && (
                            <div className="bg-white p-10 shadow-lg rounded-xl border border-slate-200 max-w-3xl mx-auto prose prose-slate">
                                <h3 className="uppercase tracking-widest text-sm font-bold text-indigo-600 border-b pb-4 mb-6">Confidential Analysis Findings</h3>
                                <ul className="space-y-4">
                                    {activeArtifact.data.findings.map((f: string, i: number) => (
                                        <li key={i} className="text-slate-800">{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default App;

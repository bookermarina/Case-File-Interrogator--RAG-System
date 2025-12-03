
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedContent, Tone, EvidenceType, Language, SearchResultItem, AspectRatio, ImageResolution, VideoResolution, WorkflowStep, AnalysisDepth, MediaType, ChatMessage, CaseSummary, DocumentType, MindMapData, MindMapNode, StreamComponent, FindingAsset, GeneratedDocument } from './types';
import { 
  interrogateCaseFile, 
  generateEvidenceVisual,
  generateReenactmentVideo, 
  extendReenactmentVideo,
  editEvidenceVisual,
  analyzeCaseFile,
  createCaseChat,
  generateLegalDocument,
  generateMindMapData
} from './services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import AssetSidebar from './components/AssetSidebar';
import Loading from './components/Loading';
import IntroScreen from './components/IntroScreen';
import { FileText, Shield, Search, Send, Key, MessageSquare, Bot, User, ArrowLeft, UploadCloud, FileImage, Sparkles, Command, ChevronRight, Zap, FileCode, Video, Image as ImageIcon, Loader2 } from 'lucide-react';

const SUGGESTED_COMMANDS = [
    { label: 'Analyze Liability', cmd: '/analyze liability', desc: 'Duty, Breach, Causation' },
    { label: 'Medical Timeline', cmd: '/analyze medical', desc: 'Chronological Injury Report' },
    { label: 'Settlement Value', cmd: '/analyze value', desc: 'Calculate Damages Range' },
    { label: "Liar's List", cmd: '/analyze liars', desc: 'Witness Contradictions' },
    { label: 'Generate Visual', cmd: '/visualize', desc: 'Create Evidence Image' },
    { label: 'Draft Memo', cmd: '/draft memo', desc: 'Internal Case Memo' },
];

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  
  // Workflow & Layout State
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  
  // Data State
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('application/pdf');
  const [isReadingFile, setIsReadingFile] = useState(false);
  
  // Assets (Managed in Sidebar)
  const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(null);
  const [keyFindings, setKeyFindings] = useState<FindingAsset[]>([]); // Structured Assets
  const [generatedVisuals, setGeneratedVisuals] = useState<GeneratedContent[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [casePrecedents, setCasePrecedents] = useState<SearchResultItem[]>([]);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showCommands, setShowCommands] = useState(false);

  // Config State (Defaults)
  const [tone, setTone] = useState<Tone>('Objective');
  const [evidenceStyle, setEvidenceStyle] = useState<EvidenceType>('Crime Scene Sketch');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  
  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for API Key
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

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setIsReadingFile(true);
      setFile(selectedFile);
      setMimeType(selectedFile.type);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFileBase64(ev.target?.result as string);
        setIsReadingFile(false);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const mergeGraphData = (newData: MindMapData) => {
      setMindMapData(prev => {
          const prevNodes = prev?.nodes || [];
          const prevEdges = prev?.edges || [];

          if (!newData) return { nodes: prevNodes, edges: prevEdges };
          
          const newNodes = [...prevNodes];
          const newEdges = [...prevEdges];

          if (Array.isArray(newData.nodes)) {
            newData.nodes.forEach(n => {
                if (!newNodes.find(pn => pn.id === n.id || pn.label === n.label)) {
                    newNodes.push(n);
                }
            });
          }

          if (Array.isArray(newData.edges)) {
            newData.edges.forEach(e => {
                if (!newEdges.find(pe => pe.source === e.source && pe.target === e.target)) {
                    newEdges.push(e);
                }
            });
          }

          return { nodes: newNodes, edges: newEdges };
      });
  };

  const initializeDashboard = async () => {
      if (!fileBase64 || isReadingFile) return;

      setWorkflowStep('dashboard');
      
      // Auto-start chat with analysis
      if (!chatSessionRef.current) {
          try {
            chatSessionRef.current = createCaseChat(fileBase64, mimeType);
          } catch (e) {
            console.error("Failed to create chat session:", e);
             setChatMessages([{
                id: 'sys-err-init',
                role: 'model',
                text: "CRITICAL ERROR: Failed to initialize Intelligence Engine. Please refresh and try again.",
                timestamp: Date.now()
            }]);
            return;
          }
      }
      
      // Add initial system message
      setChatMessages([{
          id: 'sys-init',
          role: 'model',
          text: "Secure Uplink Established. Case file ingested. I am initiating the preliminary assessment scan now...",
          timestamp: Date.now()
      }]);
      setIsChatTyping(true);

      // Trigger Analysis in background
      try {
          const result = await analyzeCaseFile(fileBase64, mimeType, 'Initial Case Assessment');
          
          if (result) {
            setCaseSummary(result.summary);
            // Save findings as the first Asset
            const initialFindingAsset: FindingAsset = {
                id: 'initial-scan',
                title: 'Initial Case Assessment',
                type: 'Initial Case Assessment',
                items: result.findings,
                timestamp: Date.now()
            };
            setKeyFindings([initialFindingAsset]);
            setCasePrecedents(result.precedents);
            if (result.graphData) mergeGraphData(result.graphData);
            
            setIsChatTyping(false);
            setChatMessages(prev => [...prev, {
                id: 'sys-result',
                role: 'model',
                text: `Analysis Complete. I have identified ${result.findings.length} key findings and extracted the case abstract. \n\nHow should we proceed?`,
                timestamp: Date.now(),
                suggestions: ['Check Witness Credibility', 'Generate Timeline', 'Draft Case Memo', 'Analyze Liability'],
                component: { type: 'analysis_result', data: result.summary }
            }]);
          } else {
             throw new Error("Empty analysis result");
          }
      } catch (e) {
          console.error("Analysis failed", e);
          setIsChatTyping(false);
          setChatMessages(prev => [...prev, {
              id: 'sys-err',
              role: 'model',
              text: "Error during initial scan. The file content may be unreadable or protected. Please try uploading a different file or asking specific questions.",
              timestamp: Date.now()
          }]);
      }
  };

  // --- COMMAND HANDLING ---
  const executeCommand = async (cmd: string) => {
      const lowerCmd = cmd.toLowerCase();
      let userQuery = cmd;
      let depth: AnalysisDepth | null = null;
      let action: 'analyze' | 'visualize' | 'draft' | 'chat' = 'chat';
      let docType: DocumentType = 'Internal Case Memo';

      // 1. Detect Intent & Map to Protocol
      
      // Explicit Slash Commands
      if (lowerCmd.includes('/analyze liability')) { depth = 'Liability & Negligence'; action = 'analyze'; }
      else if (lowerCmd.includes('/analyze medical')) { depth = 'Medical Chronology'; action = 'analyze'; }
      else if (lowerCmd.includes('/analyze value')) { depth = 'Settlement Valuation'; action = 'analyze'; }
      else if (lowerCmd.includes('/analyze liars')) { depth = "Liar's List"; action = 'analyze'; }
      else if (lowerCmd.includes('/visualize')) { action = 'visualize'; userQuery = cmd.replace(/\/visualize/i, '').trim(); }
      else if (lowerCmd.includes('/draft')) { action = 'draft'; }
      
      // Natural Language Protocol Mapping (e.g. from Suggestions)
      else if (lowerCmd.includes('witness credibility') || lowerCmd.includes('check witness')) { depth = 'Witness Credibility'; action = 'analyze'; }
      else if (lowerCmd.includes('witness bias') || lowerCmd.includes('bias detection')) { depth = 'Witness Bias Detection'; action = 'analyze'; }
      else if (lowerCmd.includes('liability') && lowerCmd.includes('analyze')) { depth = 'Liability & Negligence'; action = 'analyze'; }
      else if (lowerCmd.includes('medical') && (lowerCmd.includes('timeline') || lowerCmd.includes('chronology'))) { depth = 'Medical Chronology'; action = 'analyze'; }
      else if (lowerCmd.includes('settlement') || lowerCmd.includes('valuation') || lowerCmd.includes('damages')) { depth = 'Settlement Valuation'; action = 'analyze'; }
      else if (lowerCmd.includes('liar') && lowerCmd.includes('list')) { depth = "Liar's List"; action = 'analyze'; }
      else if (lowerCmd.includes('bias') && lowerCmd.includes('audit')) { depth = 'Bias & Fact Separation'; action = 'analyze'; }
      else if ((lowerCmd.includes('generate') || lowerCmd.includes('create')) && lowerCmd.includes('timeline')) { 
          // Timelines are typically handled as a specific visual style in this app
          action = 'visualize'; 
          userQuery = "Generate a chronological timeline of key events";
          setEvidenceStyle('Timeline Visualization');
      }
      else if (lowerCmd.includes('draft') && lowerCmd.includes('memo')) { action = 'draft'; docType = 'Internal Case Memo'; }
      else if (lowerCmd.includes('draft') && lowerCmd.includes('letter')) { action = 'draft'; docType = 'Demand Letter'; }

      // 2. Add User Message to Chat
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: cmd, timestamp: Date.now() }]);
      setIsChatTyping(true);
      setShowCommands(false);
      setChatInput('');

      try {
          if (action === 'analyze' && depth) {
              setChatMessages(prev => [...prev, { 
                  id: Date.now().toString() + '_processing', 
                  role: 'model', 
                  text: `Running protocol: ${depth}...`, 
                  timestamp: Date.now() 
              }]);

              const result = await analyzeCaseFile(fileBase64, mimeType, depth);
              
              // CREATE FINDING ASSET (Automatically Add to Sidebar)
              const newFindingAsset: FindingAsset = {
                  id: Date.now().toString(),
                  title: depth, // The AI Protocol Name becomes the Asset Title
                  type: depth,
                  items: result.findings,
                  timestamp: Date.now()
              };
              setKeyFindings(prev => [newFindingAsset, ...prev]); // Add to top

              if (result.graphData) mergeGraphData(result.graphData);
              
              setChatMessages(prev => prev.filter(m => !m.id.endsWith('_processing'))); // Remove processing msg
              setChatMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `Protocol '${depth}' Complete.\n\nI have extracted ${result.findings.length} new findings and updated the Case Graph.`,
                  timestamp: Date.now(),
                  component: { type: 'analysis_result', data: { findings: result.findings } }
              }]);
              
              // Open sidebar if closed to show new asset
              if (!isSidebarOpen) setIsSidebarOpen(true);
          } 
          else if (action === 'visualize') {
              const prompt = userQuery || "Visualize key evidence";
              const result = await interrogateCaseFile(prompt, fileBase64, mimeType, tone, evidenceStyle, 'English');
              const visualData = await generateEvidenceVisual(result.visualPrompt, aspectRatio, '1K');
              
              // CREATE VISUAL ASSET (Automatically Add to Sidebar)
              const newContent: GeneratedContent = {
                  id: Date.now().toString(),
                  type: 'image',
                  data: visualData,
                  prompt: prompt,
                  answer: result.answer,
                  timestamp: Date.now(),
                  style: evidenceStyle
              };
              setGeneratedVisuals(prev => [newContent, ...prev]);

              setChatMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: result.answer,
                  timestamp: Date.now(),
                  component: { type: 'visual_generated', data: newContent }
              }]);
               if (!isSidebarOpen) setIsSidebarOpen(true);
          }
          else if (action === 'draft') {
              // Ensure summary exists before drafting
              if (!caseSummary) {
                  throw new Error("Case summary missing. Run initial analysis first.");
              }
              setChatMessages(prev => [...prev, { 
                  id: Date.now().toString() + '_processing', 
                  role: 'model', 
                  text: `Drafting document: ${docType}...`, 
                  timestamp: Date.now() 
              }]);

              // Gather all findings so far to inform the draft
              const allFindings = keyFindings.flatMap(f => f.items);
              const docContent = await generateLegalDocument(caseSummary, allFindings, docType);
              
              // CREATE DOCUMENT ASSET (Automatically Add to Sidebar)
              const newDoc: GeneratedDocument = {
                  id: Date.now().toString(),
                  title: docType,
                  type: docType,
                  content: docContent,
                  timestamp: Date.now()
              };
              setGeneratedDocs(prev => [newDoc, ...prev]);
              
              setChatMessages(prev => prev.filter(m => !m.id.endsWith('_processing')));
              setChatMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `Document '${docType}' drafted and saved to Vault.`,
                  timestamp: Date.now(),
                  component: { type: 'doc_generated', data: { title: docType } }
              }]);
               if (!isSidebarOpen) setIsSidebarOpen(true);
          }
          else {
              // Standard Chat Fallback
              sendMessageToGemini(userQuery);
          }
      } catch (e) {
          console.error(e);
          setChatMessages(prev => prev.filter(m => !m.id.endsWith('_processing')));
          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error executing command. Please check the logs or try again.", timestamp: Date.now() }]);
      } finally {
          setIsChatTyping(false);
      }
  };

  const sendMessageToGemini = async (text: string) => {
      if (!chatSessionRef.current) return;
      
      try {
          const result = await chatSessionRef.current.sendMessageStream({ message: text });
          
          const botMsgId = (Date.now() + 1).toString();
          let fullText = '';
          
          setChatMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', timestamp: Date.now() }]);
    
          for await (const chunk of result) {
             const c = chunk as GenerateContentResponse;
             if (c.text) {
                 fullText += c.text;
                 setChatMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: fullText } : msg));
             }
          }
    
          // Suggestions parsing
          const suggestionMarker = "///SUGGESTIONS///";
          if (fullText.includes(suggestionMarker)) {
              const parts = fullText.split(suggestionMarker);
              const cleanText = parts[0];
              const suggestions = parts[1].split('|').map(s => s.trim()).filter(s => s.length > 0);
              setChatMessages(prev => prev.map(msg => msg.id === botMsgId ? { ...msg, text: cleanText.trim(), suggestions } : msg));
          }
      } catch (e) {
          console.error("Chat error", e);
          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection interrupted. Please try again.", timestamp: Date.now() }]);
      }
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setChatInput(val);
      if (val.startsWith('/')) setShowCommands(true);
      else setShowCommands(false);
  };

  const handleGenerateMindMap = async () => {
     try {
         const data = await generateMindMapData(fileBase64, mimeType);
         mergeGraphData(data); // Merge instead of overwrite
         // Switch asset tab to graph handled in sidebar
         executeCommand("Full Mind Map generated and merged into the Graph tab.");
     } catch(e) { console.error(e); }
  };

  // --- RENDERERS ---

  const renderStreamComponent = (comp: StreamComponent) => {
      if (comp.type === 'analysis_result') {
          return (
              <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-in zoom-in">
                  <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Analysis Output</span>
                  </div>
                  {comp.data.synopsis && <p className="text-xs text-slate-600 italic mb-2">"{comp.data.synopsis}"</p>}
                  {comp.data.findings && (
                      <ul className="list-disc pl-4 space-y-1">
                          {comp.data.findings.slice(0, 3).map((f:string, i:number) => (
                              <li key={i} className="text-[10px] text-slate-700 font-mono">{f}</li>
                          ))}
                      </ul>
                  )}
              </div>
          );
      }
      if (comp.type === 'visual_generated') {
          return (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group animate-in zoom-in">
                  <img src={comp.data.data} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white drop-shadow-md">View in Asset Vault</span>
                  </div>
              </div>
          );
      }
      return null;
  };

  if (workflowStep === 'upload') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Minimal Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white"></div>
                <div className="absolute inset-0 bg-grid-slate-900/[0.03] bg-[length:32px_32px]"></div>
            </div>
            
            {showIntro ? <IntroScreen onComplete={() => setShowIntro(false)} /> : (
            <div className="glass-panel max-w-xl w-full p-10 rounded-2xl flex flex-col items-center gap-8 animate-in fade-in slide-in-up z-10 border-slate-200">
                 <div className="text-center space-y-2">
                     <h1 className="text-3xl font-display font-bold text-slate-900 uppercase tracking-widest">Case File <span className="text-indigo-600">Interrogator</span></h1>
                     <p className="text-xs font-mono text-slate-500 tracking-[0.3em]">INTELLIGENCE-FIRST LEGAL FORENSICS</p>
                 </div>
                 
                 <div 
                    onClick={() => !isReadingFile && fileInputRef.current?.click()}
                    className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${file ? 'border-indigo-500/50 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'} ${isReadingFile ? 'opacity-50 cursor-wait' : ''}`}
                 >
                     <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="application/pdf, text/plain, image/*" />
                     {isReadingFile ? (
                        <>
                            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            <span className="font-mono text-xs text-indigo-600 uppercase animate-pulse">Ingesting File Data...</span>
                        </>
                     ) : file ? (
                         <>
                            <FileText className="w-12 h-12 text-indigo-600" />
                            <span className="font-mono text-sm text-slate-900">{file.name}</span>
                         </>
                     ) : (
                         <>
                            <UploadCloud className="w-12 h-12 text-slate-400" />
                            <span className="font-mono text-xs text-slate-500 uppercase">Drop Case File to Initialize</span>
                         </>
                     )}
                 </div>

                 <button 
                    disabled={!file || isReadingFile}
                    onClick={initializeDashboard}
                    className="w-full btn-primary py-4 rounded-lg font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isReadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} 
                    {isReadingFile ? 'Processing...' : 'Initialize Dashboard'}
                 </button>
            </div>
            )}
        </div>
      );
  }

  // DASHBOARD VIEW
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
        {!checkingKey && !hasApiKey && (
             <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"><button onClick={handleSelectKey} className="btn-primary px-8 py-4 rounded uppercase">Authenticate API Key</button></div>
        )}

        {/* LEFT COLUMN: INTELLIGENCE STREAM */}
        <div className="flex-1 flex flex-col relative border-r border-slate-200 bg-white">
            {/* Header */}
            <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur flex items-center justify-between px-6 z-20">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <span className="font-display font-bold text-sm tracking-widest text-slate-900 uppercase">Intelligence Stream</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono text-slate-400">ONLINE</span>
                </div>
            </header>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-up`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-indigo-600 text-white'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div className="max-w-[80%] space-y-2">
                            <div className={`p-4 rounded-lg text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-white text-slate-800 border border-slate-200' : 'bg-indigo-50 text-slate-800 border border-indigo-100'}`}>
                                {msg.text}
                            </div>
                            {msg.component && renderStreamComponent(msg.component)}
                            {msg.suggestions && (
                                <div className="flex flex-wrap gap-2">
                                    {msg.suggestions.map((s, i) => (
                                        <button key={i} onClick={() => executeCommand(s)} className="px-3 py-1 rounded-full border border-indigo-200 bg-white text-[10px] text-indigo-600 uppercase hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center gap-1 shadow-sm font-medium">
                                            {s} <ChevronRight className="w-2 h-2" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isChatTyping && (
                    <div className="flex gap-4">
                         <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
                         <div className="flex items-center gap-1 h-10 px-4 bg-white rounded-lg border border-slate-200 shadow-sm"><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></div></div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Command Input */}
            <div className="p-4 bg-white border-t border-slate-200 relative z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
                {showCommands && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-up">
                        <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">Available Protocols</div>
                        {SUGGESTED_COMMANDS.filter(c => c.cmd.includes(chatInput)).map((cmd, i) => (
                            <button key={i} onClick={() => executeCommand(cmd.cmd)} className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group">
                                <div>
                                    <span className="block text-xs font-bold text-indigo-600 group-hover:text-indigo-800">{cmd.label}</span>
                                    <span className="block text-[10px] text-slate-400 font-mono">{cmd.desc}</span>
                                </div>
                                <Command className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                            </button>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <input 
                        value={chatInput}
                        onChange={handleChatInputChange}
                        onKeyDown={(e) => { if(e.key === 'Enter') executeCommand(chatInput); }}
                        placeholder="Ask a question or type '/' for protocols..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-12 py-4 text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-400 outline-none placeholder:text-slate-400 shadow-inner transition-all"
                    />
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <button onClick={() => executeCommand(chatInput)} disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded transition-colors disabled:opacity-30">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: ASSET VAULT */}
        <div className={`w-[450px] flex-shrink-0 transition-all duration-500 border-l border-slate-200 bg-slate-50 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full hidden'}`}>
             <AssetSidebar 
                summary={caseSummary}
                findings={keyFindings}
                visuals={generatedVisuals}
                documents={generatedDocs}
                precedents={casePrecedents}
                mindMapData={mindMapData}
                onEditVisual={(prompt) => executeCommand(`/visualize ${prompt}`)}
                onGenerateMindMap={handleGenerateMindMap}
                onNodeClick={(node) => executeCommand(`Tell me about ${node.label}`)}
             />
        </div>
    </div>
  );
};

export default App;

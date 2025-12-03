
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedContent, Tone, EvidenceType, Language, SearchResultItem, AspectRatio, ImageResolution, VideoResolution, WorkflowStep, AnalysisDepth, MediaType, ChatMessage, CaseSummary, DocumentType, MindMapData, MindMapNode, StreamComponent } from './types';
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
import { FileText, Shield, Search, Send, Key, MessageSquare, Bot, User, ArrowLeft, UploadCloud, FileImage, Sparkles, Command, ChevronRight, Zap, FileCode, Video, Image as ImageIcon } from 'lucide-react';

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
  
  // Assets (Managed in Sidebar)
  const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(null);
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [generatedVisuals, setGeneratedVisuals] = useState<GeneratedContent[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<{ title: string, content: string, type: DocumentType }[]>([]);
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
      setFile(selectedFile);
      setMimeType(selectedFile.type);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFileBase64(ev.target?.result as string);
        // Do not auto-analyze immediately, let user enter dashboard and "Initialize"
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const initializeDashboard = async () => {
      setWorkflowStep('dashboard');
      // Auto-start chat with analysis
      if (!chatSessionRef.current) {
          chatSessionRef.current = createCaseChat(fileBase64, mimeType);
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
          setCaseSummary(result.summary);
          setKeyFindings(result.findings);
          setCasePrecedents(result.precedents);
          
          setIsChatTyping(false);
          setChatMessages(prev => [...prev, {
              id: 'sys-result',
              role: 'model',
              text: `Analysis Complete. I have identified ${result.findings.length} key findings and extracted the case abstract. \n\nHow should we proceed?`,
              timestamp: Date.now(),
              suggestions: ['Generate Timeline', 'Check Witness Credibility', 'Draft Case Memo'],
              component: { type: 'analysis_result', data: result.summary }
          }]);
      } catch (e) {
          setIsChatTyping(false);
          setChatMessages(prev => [...prev, {
              id: 'sys-err',
              role: 'model',
              text: "Error during initial scan. Please ensure the file is readable.",
              timestamp: Date.now()
          }]);
      }
  };

  // --- COMMAND HANDLING ---
  const executeCommand = async (cmd: string) => {
      let userQuery = cmd;
      let depth: AnalysisDepth | null = null;
      let action: 'analyze' | 'visualize' | 'draft' | 'chat' = 'chat';
      let docType: DocumentType = 'Internal Case Memo';

      if (cmd.includes('/analyze liability')) { depth = 'Liability & Negligence'; action = 'analyze'; }
      else if (cmd.includes('/analyze medical')) { depth = 'Medical Chronology'; action = 'analyze'; }
      else if (cmd.includes('/analyze value')) { depth = 'Settlement Valuation'; action = 'analyze'; }
      else if (cmd.includes('/analyze liars')) { depth = "Liar's List"; action = 'analyze'; }
      else if (cmd.includes('/visualize')) { action = 'visualize'; userQuery = cmd.replace('/visualize', '').trim(); }
      else if (cmd.includes('/draft')) { action = 'draft'; }

      // 1. Add User Message
      setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userQuery, timestamp: Date.now() }]);
      setIsChatTyping(true);
      setShowCommands(false);
      setChatInput('');

      try {
          if (action === 'analyze' && depth) {
              const result = await analyzeCaseFile(fileBase64, mimeType, depth);
              // Merge findings
              setKeyFindings(prev => [...prev, ...result.findings]);
              
              setChatMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `Protocol '${depth}' Complete. Findings added to Asset Vault.`,
                  timestamp: Date.now(),
                  component: { type: 'analysis_result', data: { findings: result.findings } }
              }]);
          } 
          else if (action === 'visualize') {
              const prompt = userQuery || "Visualize key evidence";
              const result = await interrogateCaseFile(prompt, fileBase64, mimeType, tone, evidenceStyle, 'English');
              const visualData = await generateEvidenceVisual(result.visualPrompt, aspectRatio, '1K');
              
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
          }
          else if (action === 'draft') {
              const doc = await generateLegalDocument(caseSummary!, keyFindings, docType);
              setGeneratedDocs(prev => [{ title: docType, content: doc, type: docType }, ...prev]);
              setChatMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'model',
                  text: `Document '${docType}' drafted and saved to Vault.`,
                  timestamp: Date.now(),
                  component: { type: 'doc_generated', data: { title: docType } }
              }]);
          }
          else {
              // Standard Chat
              sendMessageToGemini(userQuery);
          }
      } catch (e) {
          setChatMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error executing command.", timestamp: Date.now() }]);
      } finally {
          setIsChatTyping(false);
      }
  };

  const sendMessageToGemini = async (text: string) => {
      if (!chatSessionRef.current) return;
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
         setMindMapData(data);
         // Switch asset tab to graph handled in sidebar
     } catch(e) { console.error(e); }
  };

  // --- RENDERERS ---

  const renderStreamComponent = (comp: StreamComponent) => {
      if (comp.type === 'analysis_result') {
          return (
              <div className="mt-2 p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg animate-in zoom-in">
                  <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Analysis Output</span>
                  </div>
                  {comp.data.synopsis && <p className="text-xs text-slate-300 italic mb-2">"{comp.data.synopsis}"</p>}
                  {comp.data.findings && (
                      <ul className="list-disc pl-4 space-y-1">
                          {comp.data.findings.slice(0, 3).map((f:string, i:number) => (
                              <li key={i} className="text-[10px] text-slate-400 font-mono">{f}</li>
                          ))}
                      </ul>
                  )}
              </div>
          );
      }
      if (comp.type === 'visual_generated') {
          return (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 relative group animate-in zoom-in">
                  <img src={comp.data.data} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-bold text-white">View in Asset Vault</span>
                  </div>
              </div>
          );
      }
      return null;
  };

  if (workflowStep === 'upload') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="fixed inset-0 overflow-hidden pointer-events-none"><div className="animate-scanline"></div></div>
            {showIntro ? <IntroScreen onComplete={() => setShowIntro(false)} /> : (
            <div className="glass-panel max-w-xl w-full p-10 rounded-2xl flex flex-col items-center gap-8 animate-in fade-in slide-in-up">
                 <div className="text-center space-y-2">
                     <h1 className="text-3xl font-display font-bold text-white uppercase tracking-widest text-glow">Case File <span className="text-cyan-400">Interrogator</span></h1>
                     <p className="text-xs font-mono text-cyan-500/70 tracking-[0.3em]">INTELLIGENCE-FIRST LEGAL FORENSICS</p>
                 </div>
                 
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${file ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/50'}`}
                 >
                     <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="application/pdf, text/plain, image/*" />
                     {file ? (
                         <>
                            <FileText className="w-12 h-12 text-cyan-400" />
                            <span className="font-mono text-sm text-white">{file.name}</span>
                         </>
                     ) : (
                         <>
                            <UploadCloud className="w-12 h-12 text-slate-600" />
                            <span className="font-mono text-xs text-slate-500 uppercase">Drop Case File to Initialize</span>
                         </>
                     )}
                 </div>

                 <button 
                    disabled={!file}
                    onClick={initializeDashboard}
                    className="w-full btn-primary py-4 rounded-lg font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    <Zap className="w-4 h-4" /> Initialize Dashboard
                 </button>
            </div>
            )}
        </div>
      );
  }

  // DASHBOARD VIEW
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        {!checkingKey && !hasApiKey && (
             <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"><button onClick={handleSelectKey} className="btn-primary px-8 py-4 rounded uppercase">Authenticate API Key</button></div>
        )}

        {/* LEFT COLUMN: INTELLIGENCE STREAM */}
        <div className="flex-1 flex flex-col relative border-r border-slate-800/50">
            {/* Header */}
            <header className="h-16 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="font-display font-bold text-sm tracking-widest text-white uppercase">Intelligence Stream</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono text-cyan-500/50">ONLINE</span>
                </div>
            </header>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-up`}>
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800' : 'bg-cyan-950/30 border border-cyan-500/20'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-cyan-500" />}
                        </div>
                        <div className="max-w-[80%] space-y-2">
                            <div className={`p-4 rounded-lg text-sm font-mono leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-slate-800 text-slate-200' : 'bg-slate-900/50 text-cyan-100 border border-cyan-500/10'}`}>
                                {msg.text}
                            </div>
                            {msg.component && renderStreamComponent(msg.component)}
                            {msg.suggestions && (
                                <div className="flex flex-wrap gap-2">
                                    {msg.suggestions.map((s, i) => (
                                        <button key={i} onClick={() => executeCommand(s)} className="px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-[10px] text-cyan-400 uppercase hover:bg-cyan-500/20 transition-colors flex items-center gap-1">
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
                         <div className="w-8 h-8 rounded bg-cyan-950/30 flex items-center justify-center"><Bot className="w-4 h-4 text-cyan-500" /></div>
                         <div className="flex items-center gap-1 h-10 px-4 bg-slate-900/30 rounded border border-slate-800"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce delay-200"></div></div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Command Input */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 relative">
                {showCommands && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-up">
                        <div className="p-2 bg-slate-950 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase">Available Protocols</div>
                        {SUGGESTED_COMMANDS.filter(c => c.cmd.includes(chatInput)).map((cmd, i) => (
                            <button key={i} onClick={() => executeCommand(cmd.cmd)} className="w-full text-left px-4 py-3 hover:bg-cyan-950/30 flex items-center justify-between group">
                                <div>
                                    <span className="block text-xs font-bold text-cyan-400 group-hover:text-white">{cmd.label}</span>
                                    <span className="block text-[10px] text-slate-500 font-mono">{cmd.desc}</span>
                                </div>
                                <Command className="w-3 h-3 text-slate-600" />
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
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-12 py-4 text-sm font-mono text-white focus:border-cyan-500/50 outline-none"
                    />
                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                    <button onClick={() => executeCommand(chatInput)} disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-900/30 hover:bg-cyan-500/20 text-cyan-400 rounded transition-colors disabled:opacity-30">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: ASSET VAULT */}
        <div className={`w-[450px] flex-shrink-0 transition-all duration-500 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full hidden'}`}>
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

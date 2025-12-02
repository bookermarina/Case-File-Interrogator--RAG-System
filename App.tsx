
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { GeneratedContent, Tone, EvidenceType, Language, SearchResultItem, AspectRatio, ImageResolution, VideoResolution, WorkflowStep, AnalysisDepth, MediaType, ChatMessage, CaseSummary, DocumentType } from './types';
import { 
  interrogateCaseFile, 
  generateEvidenceVisual,
  generateReenactmentVideo, 
  extendReenactmentVideo,
  editEvidenceVisual,
  analyzeCaseFile,
  createCaseChat,
  generateLegalDocument
} from './services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import Infographic from './components/Infographic';
import Loading from './components/Loading';
import IntroScreen from './components/IntroScreen';
import SearchResults from './components/SearchResults';
import { FileText, AlertCircle, History, Shield, Scale, Search, Send, Globe, Sun, Moon, Key, CreditCard, LayoutTemplate, Monitor, ArrowLeft, UploadCloud, Gavel, Video, Image as ImageIcon, PlayCircle, Lock, MessageSquare, Bot, User, FileImage, File, ClipboardList, CalendarClock, Tag, Copy, Download, X, Printer } from 'lucide-react';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  
  // Workflow State
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('upload');
  
  // Input Data
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('application/pdf');
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [caseSummary, setCaseSummary] = useState<CaseSummary | null>(null);
  const [query, setQuery] = useState('');
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>('Initial Case Assessment');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Configuration
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [tone, setTone] = useState<Tone>('Objective');
  const [evidenceStyle, setEvidenceStyle] = useState<EvidenceType>('Crime Scene Sketch');
  const [language, setLanguage] = useState<Language>('English');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9'); // Default landscape for evidence
  
  const [imgResolution, setImgResolution] = useState<ImageResolution>('1K');
  const [vidResolution, setVidResolution] = useState<VideoResolution>('720p');
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [loadingEntities, setLoadingEntities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResultItem[]>([]);
  const [casePrecedents, setCasePrecedents] = useState<SearchResultItem[]>([]); // New State for Precedents
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Document Generation State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [docTypeToGenerate, setDocTypeToGenerate] = useState<DocumentType>('Internal Case Memo');
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check for API Key on Mount
  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatTyping]);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        setError(null);
      } catch (e) {
        console.error("Failed to open key selector:", e);
      }
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
        setError(null);
        // Reset chat when new file is uploaded
        chatSessionRef.current = null;
        setChatMessages([]);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyzeFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!fileBase64) {
      setError("Please upload a case file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(0);
    setLoadingMessage(`Initiating ${analysisDepth.toLowerCase()} scan...`);
    
    try {
      const result = await analyzeCaseFile(fileBase64, mimeType, analysisDepth);
      if (result.findings.length === 0) {
        setError("Could not extract findings. Ensure the document contains readable text.");
      } else {
        setKeyFindings(result.findings);
        setCaseSummary(result.summary);
        setCasePrecedents(result.precedents); // Set the precedents
        setWorkflowStep('review');
      }
    } catch (err: any) {
      console.error(err);
       if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. Please check your API key.");
          setHasApiKey(false); 
      } else {
          setError('Failed to analyze file. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFinding = (finding: string) => {
    setQuery(`Investigate finding: "${finding}"`);
    setWorkflowStep('interrogate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartChat = () => {
    setWorkflowStep('chat');
    if (!chatSessionRef.current) {
       chatSessionRef.current = createCaseChat(fileBase64, mimeType);
       setChatMessages([{
         id: 'init',
         role: 'model',
         text: "I have reviewed the case file. I am ready to answer your questions. Be specific.",
         timestamp: Date.now()
       }]);
    }
  };

  const sendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatTyping(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: text });
      
      const botMsgId = (Date.now() + 1).toString();
      let fullText = '';
      
      setChatMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of result) {
         const c = chunk as GenerateContentResponse;
         if (c.text) {
             fullText += c.text;
             setChatMessages(prev => prev.map(msg => 
               msg.id === botMsgId ? { ...msg, text: fullText } : msg
             ));
         }
      }

      // Parse suggestions after stream
      const suggestionMarker = "///SUGGESTIONS///";
      if (fullText.includes(suggestionMarker)) {
          const parts = fullText.split(suggestionMarker);
          const cleanText = parts[0];
          const suggestionsRaw = parts[1];
          const suggestions = suggestionsRaw.split('|').map(s => s.trim()).filter(s => s.length > 0);
          
          setChatMessages(prev => prev.map(msg => 
             msg.id === botMsgId ? { ...msg, text: cleanText.trim(), suggestions } : msg
          ));
      }

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Error: Connection lost. Please retry.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatTyping) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleSkipToInterrogate = () => {
    setQuery('');
    setWorkflowStep('interrogate');
  };

  const toggleMediaType = (type: MediaType) => {
    setMediaType(type);
    if (type === 'video') {
      if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        setAspectRatio('16:9');
      }
    }
  };

  const handleGenerateTimeline = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingEntities([]);
    setCurrentSearchResults([]);
    setLoadingMessage("Constructing chronological framework...");
    
    const timelineQuery = "Construct a detailed visual timeline of all key events in this case, chronologically ordered.";
    const timelineStyle: EvidenceType = 'Timeline Visualization';

    try {
      // Step 1: Interrogate
      const result = await interrogateCaseFile(timelineQuery, fileBase64, mimeType, 'Objective', timelineStyle, language);
      setLoadingEntities(result.keyEntities);
      setCurrentSearchResults(result.searchResults);
      setLoadingStep(2);
      
      // Step 2: Visual
      setLoadingMessage(`Rendering timeline visualization...`);
      const finalData = await generateEvidenceVisual(result.visualPrompt, '16:9', '1K');

      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        type: 'image',
        data: finalData,
        prompt: timelineQuery,
        answer: result.answer,
        timestamp: Date.now(),
        tone: 'Objective',
        style: timelineStyle,
        language: language,
        aspectRatio: '16:9',
        resolution: '1K',
      };

      setContentHistory([newContent, ...contentHistory]);
      setWorkflowStep('view');
    } catch (err: any) {
       console.error(err);
       setError('Failed to generate timeline.');
    } finally {
       setIsLoading(false);
       setLoadingStep(0);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!query.trim()) {
        setError("Please enter an interrogation query.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingEntities([]);
    setCurrentSearchResults([]);
    setLoadingMessage(`Interrogating case file: "${query.substring(0, 30)}..."`);

    try {
      // Step 1: Interrogate & Plan
      const result = await interrogateCaseFile(query, fileBase64, mimeType, tone, evidenceStyle, language);
      
      setLoadingEntities(result.keyEntities);
      setCurrentSearchResults(result.searchResults);
      
      setLoadingStep(2);
      
      let finalData = '';
      let videoMetadata = null;
      const timestamp = Date.now();
      
      if (mediaType === 'image') {
        setLoadingMessage(`Generating ${evidenceStyle} visualization...`);
        finalData = await generateEvidenceVisual(result.visualPrompt, aspectRatio, imgResolution);
      } else {
        setLoadingMessage(`Reconstructing scene in ${vidResolution}...`);
        const videoResult = await generateReenactmentVideo(result.visualPrompt, aspectRatio, vidResolution);
        finalData = videoResult.url;
        videoMetadata = videoResult.metadata;
      }
      
      const newContent: GeneratedContent = {
        id: timestamp.toString(),
        type: mediaType,
        data: finalData,
        prompt: query,
        answer: result.answer,
        timestamp: timestamp,
        tone: tone,
        style: evidenceStyle,
        language: language,
        aspectRatio: aspectRatio,
        resolution: mediaType === 'image' ? imgResolution : vidResolution,
        videoMetadata: videoMetadata
      };

      setContentHistory([newContent, ...contentHistory]);
      setWorkflowStep('view');
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes("Requested entity was not found") || err.message.includes("404") || err.message.includes("403"))) {
          setError("Access denied. The selected API key does not have access.");
          setHasApiKey(false); 
      } else {
          setError('System Failure: Analysis service disrupted. Retry.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (contentHistory.length === 0) return;
    const currentContent = contentHistory[0];
    
    setIsLoading(true);
    setError(null);
    setLoadingStep(2);

    try {
      if (currentContent.type === 'video') {
         setLoadingMessage(`Updating reconstruction: "${editPrompt}"...`);
         
         if (!currentContent.videoMetadata) {
             throw new Error("Missing video metadata.");
         }

         const result = await extendReenactmentVideo(
            currentContent.videoMetadata, 
            editPrompt, 
            currentContent.aspectRatio || '16:9'
         );

         const newContent: GeneratedContent = {
            ...currentContent,
            id: Date.now().toString(),
            data: result.url,
            prompt: currentContent.prompt + " + " + editPrompt,
            timestamp: Date.now(),
            videoMetadata: result.metadata
         };
         setContentHistory([newContent, ...contentHistory]);

      } else {
          setLoadingMessage(`Refining evidence: "${editPrompt}"...`);
          const base64Data = await editEvidenceVisual(currentContent.data, editPrompt);
          const newContent: GeneratedContent = {
            ...currentContent,
            id: Date.now().toString(),
            data: base64Data,
            prompt: editPrompt,
            timestamp: Date.now(),
          };
          setContentHistory([newContent, ...contentHistory]);
      }
      setWorkflowStep('view');
    } catch (err: any) {
      console.error(err);
      setError('Modification failed.');
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleGenerateDoc = async () => {
    if (!caseSummary || !keyFindings.length) return;
    
    setIsGeneratingDoc(true);
    setGeneratedDoc('');
    setIsDocModalOpen(true);
    
    try {
        const docText = await generateLegalDocument(caseSummary, keyFindings, docTypeToGenerate);
        setGeneratedDoc(docText);
    } catch (e) {
        setGeneratedDoc("Error generating document.");
    } finally {
        setIsGeneratingDoc(false);
    }
  };

  const DocumentModal = () => (
    <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="glass-panel w-full max-w-4xl h-[80vh] flex flex-col rounded-xl relative border border-cyan-500/20">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-950/50">
                <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-display font-bold text-white uppercase tracking-widest text-glow-sm">Legal Drafting Suite</h2>
                </div>
                <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar Controls */}
                <div className="w-full md:w-64 bg-slate-900/50 p-6 border-b md:border-b-0 md:border-r border-slate-700/50 flex flex-col gap-6">
                     <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">Document Type</label>
                        <select 
                            value={docTypeToGenerate}
                            onChange={(e) => setDocTypeToGenerate(e.target.value as DocumentType)}
                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                        >
                            <option value="Internal Case Memo">Internal Case Memo</option>
                            <option value="Demand Letter">Demand Letter</option>
                            <option value="Client Status Update">Client Status Update</option>
                            <option value="Motion in Limine (Draft)">Motion in Limine (Draft)</option>
                            <option value="Deposition Questions Outline">Deposition Questions</option>
                        </select>
                     </div>
                     <button 
                        onClick={handleGenerateDoc}
                        disabled={isGeneratingDoc}
                        className="btn-primary py-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                        {isGeneratingDoc ? <LoadingSpinner size="sm" /> : <Printer className="w-3 h-3" />}
                        <span>{isGeneratingDoc ? 'Drafting...' : 'Generate Draft'}</span>
                     </button>
                </div>
                
                {/* Editor Area */}
                <div className="flex-1 bg-slate-950/80 p-8 overflow-y-auto relative">
                     {isGeneratingDoc ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                             <div className="w-12 h-12 border-2 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                             <p className="text-xs font-mono text-cyan-500 uppercase tracking-widest animate-pulse">Compiling Legal Analysis...</p>
                         </div>
                     ) : generatedDoc ? (
                         <div className="prose prose-invert prose-sm max-w-none font-mono">
                             <pre className="whitespace-pre-wrap font-mono text-slate-300 text-sm">{generatedDoc}</pre>
                         </div>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                             <FileText className="w-16 h-16" />
                             <p className="text-xs uppercase tracking-widest">Select document type to begin drafting</p>
                         </div>
                     )}
                </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-950/50 flex justify-end gap-3">
                 <button 
                    onClick={() => navigator.clipboard.writeText(generatedDoc)}
                    disabled={!generatedDoc}
                    className="btn-secondary px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                 >
                    <Copy className="w-3 h-3" /> Copy Text
                 </button>
                 <button 
                    disabled={!generatedDoc}
                    onClick={() => {
                        const blob = new Blob([generatedDoc], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${docTypeToGenerate.replace(/\s+/g, '_')}_Draft.txt`;
                        a.click();
                    }}
                    className="btn-secondary px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                 >
                    <Download className="w-3 h-3" /> Download .txt
                 </button>
            </div>
        </div>
    </div>
  );

  const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
    <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'} border-2 border-cyan-900 border-t-cyan-500 rounded-full animate-spin`}></div>
  );

  const restoreContent = (content: GeneratedContent) => {
     const newHistory = contentHistory.filter(i => i.id !== content.id);
     setContentHistory([content, ...newHistory]);
     setWorkflowStep('view');
  };

  const KeySelectionModal = () => (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="glass-panel max-w-md w-full p-8 rounded-xl border border-cyan-500/30">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-cyan-950/50 rounded-full flex items-center justify-center text-cyan-400 mb-2 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <Shield className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest text-glow">Security Clearance</h2>
                    <p className="text-slate-400 text-sm font-mono leading-relaxed">Gemini Ultra credentials required for access to classified analysis models.</p>
                </div>
                <button 
                    onClick={handleSelectKey}
                    className="w-full btn-primary py-4 rounded-lg font-bold flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                >
                    <Key className="w-4 h-4" />
                    <span>Authenticate Credentials</span>
                </button>
            </div>
        </div>
    </div>
  );

  const renderStepContent = () => {
    switch (workflowStep) {
        case 'upload':
            return (
                <div className="w-full animate-in slide-in-right duration-700 relative z-10">
                     <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                        <div className="animate-scanline"></div>
                     </div>
                     <form onSubmit={handleAnalyzeFile} className="glass-panel p-8 md:p-10 rounded-xl flex flex-col gap-8">
                        <div className="space-y-2 text-center mb-2">
                             <h2 className="text-2xl font-display font-bold text-white uppercase tracking-widest flex items-center justify-center gap-3 text-glow">
                                <FileText className="w-6 h-6 text-cyan-400" /> Case File Ingestion
                             </h2>
                             <p className="text-xs text-cyan-500/70 font-mono uppercase tracking-[0.2em]">Upload Evidence (PDF, Text, Images)</p>
                        </div>

                        <div 
                            className={`relative border-2 border-dashed rounded-xl p-10 transition-all text-center cursor-pointer group ${file ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-slate-700 hover:border-cyan-500/30 hover:bg-slate-900/50'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload} 
                                accept="application/pdf, text/plain, image/*" 
                                className="hidden" 
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-3">
                                    {mimeType.startsWith('image') ? <FileImage className="w-12 h-12 text-cyan-400 animate-in zoom-in" /> : <FileText className="w-12 h-12 text-cyan-400 animate-in zoom-in" />}
                                    <span className="text-white font-bold font-mono tracking-wide">{file.name}</span>
                                    <span className="text-xs text-cyan-500/70 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB // READY FOR SCAN</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-cyan-400/70 transition-colors">
                                    <UploadCloud className="w-12 h-12 mb-2" />
                                    <span className="font-bold uppercase tracking-wider text-sm">Drop Case File Here</span>
                                    <span className="text-[10px] font-mono opacity-70">SECURE UPLOAD // ENCRYPTED</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Analysis Protocol</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['Initial Case Assessment', 'Medical Chronology', 'Liability & Negligence', 'Witness Credibility', 'Settlement Valuation', 'Bias & Fact Separation', "Liar's List"] as AnalysisDepth[]).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setAnalysisDepth(type)}
                                        className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all duration-300 ${analysisDepth === type ? 'bg-cyan-950/50 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-slate-950/30 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}
                                    >
                                        <span className="text-[10px] md:text-xs font-bold uppercase text-center tracking-wide">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !file}
                            className="w-full btn-primary py-5 rounded-lg font-bold font-display tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group uppercase text-sm mt-4"
                        >
                            <span>Initialize Scan</span>
                            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    </form>
                </div>
            );
        case 'review':
            return (
                <div className="w-full animate-in slide-in-right duration-700 space-y-6 relative z-10">
                    <div className="flex items-center justify-between">
                         <button onClick={() => setWorkflowStep('upload')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors text-xs font-mono uppercase tracking-wider">
                            <ArrowLeft className="w-3 h-3" /> Re-Upload
                         </button>
                         <h2 className="text-sm font-display font-bold text-white uppercase tracking-widest text-glow-sm">
                            {analysisDepth} Analysis
                         </h2>
                    </div>

                    {caseSummary && (
                      <div className="glass-panel rounded-lg p-6 animate-in fade-in slide-in-up delay-100 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" /> Executive Case Abstract
                             </h3>
                             {caseSummary.tags && caseSummary.tags.length > 0 && (
                                 <div className="flex gap-2">
                                     {caseSummary.tags.map((tag, idx) => (
                                         <span key={idx} className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 text-[9px] text-cyan-400 font-mono uppercase tracking-wide">
                                             {tag}
                                         </span>
                                     ))}
                                 </div>
                             )}
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono mb-4">
                            <div className="p-3 bg-slate-950/50 rounded border border-slate-800">
                               <span className="text-slate-500 block uppercase text-[9px] mb-1 tracking-wider">Parties</span>
                               <span className="text-white font-bold truncate block" title={caseSummary.parties}>{caseSummary.parties}</span>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded border border-slate-800">
                               <span className="text-slate-500 block uppercase text-[9px] mb-1 tracking-wider">Incident</span>
                               <span className="text-slate-300 truncate block" title={caseSummary.incidentType}>{caseSummary.incidentType}</span>
                            </div>
                            <div className="p-3 bg-slate-950/50 rounded border border-slate-800">
                               <span className="text-slate-500 block uppercase text-[9px] mb-1 tracking-wider">Date</span>
                               <span className="text-slate-300 truncate block" title={caseSummary.date}>{caseSummary.date}</span>
                            </div>
                             <div className="p-3 bg-slate-950/50 rounded border border-slate-800">
                               <span className="text-slate-500 block uppercase text-[9px] mb-1 tracking-wider">Jurisdiction</span>
                               <span className="text-slate-300 truncate block" title={caseSummary.jurisdiction}>{caseSummary.jurisdiction}</span>
                            </div>
                         </div>
                         <div className="bg-slate-950/30 p-4 rounded border border-slate-800/50">
                            <p className="text-slate-300 text-sm leading-relaxed font-mono">
                                <span className="text-cyan-500 font-bold mr-2">SYNOPSIS &gt;&gt;</span>
                                {caseSummary.synopsis}
                            </p>
                         </div>
                      </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                                <Scale className="w-4 h-4" /> Critical Findings
                            </h3>
                            <button 
                                onClick={() => { setDocTypeToGenerate('Internal Case Memo'); handleGenerateDoc(); }}
                                className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                            >
                                <Printer className="w-3 h-3" /> Draft Documents
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {keyFindings.map((q, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSelectFinding(q)}
                                    className="text-left p-4 glass-panel-interactive rounded-lg group transition-all border border-slate-800 hover:border-cyan-500/30"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-cyan-600 font-mono text-xs mt-1 opacity-70">0{idx + 1}</span>
                                        <p className="text-slate-300 font-mono text-sm leading-relaxed group-hover:text-white transition-colors">{q}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New: Display Precedents if available */}
                    {casePrecedents.length > 0 && (
                        <div className="animate-in fade-in slide-in-up delay-200">
                            <SearchResults results={casePrecedents} />
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button 
                             onClick={handleStartChat}
                             className="flex-1 btn-secondary py-4 text-xs font-mono flex items-center justify-center gap-2 uppercase tracking-wide rounded-lg"
                        >
                            <MessageSquare className="w-4 h-4 text-cyan-500" /> Consult Counsel
                        </button>
                        <button 
                             onClick={handleGenerateTimeline}
                             className="flex-1 btn-secondary py-4 text-xs font-mono flex items-center justify-center gap-2 uppercase tracking-wide rounded-lg hover:border-cyan-500/50 hover:text-cyan-400"
                        >
                            <CalendarClock className="w-4 h-4 text-cyan-500" /> Generate Timeline
                        </button>
                        <button 
                             onClick={handleSkipToInterrogate}
                             className="flex-1 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-mono flex items-center justify-center gap-2 uppercase tracking-wide rounded-lg transition-colors"
                        >
                            Visualize Evidence <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            );
        case 'chat':
            return (
                <div className="w-full animate-in slide-in-right duration-700 relative z-10 h-[650px] flex flex-col glass-panel rounded-xl">
                    {/* Chat Header */}
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                <Bot className="w-5 h-5 text-cyan-400" />
                             </div>
                             <div>
                                 <h3 className="text-xs font-bold text-white uppercase tracking-widest text-glow-sm">Senior Associate</h3>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    <p className="text-[9px] text-cyan-500/70 font-mono">SECURE UPLINK // ONLINE</p>
                                 </div>
                             </div>
                        </div>
                        <button onClick={() => setWorkflowStep('review')} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-up duration-300`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-800 border border-slate-700' : 'bg-cyan-950/30 border border-cyan-500/20'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-cyan-500" />}
                                </div>
                                <div className="flex flex-col gap-2 max-w-[85%]">
                                    <div className={`rounded-lg p-4 text-sm font-mono leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-slate-800/80 text-slate-200 border border-slate-700' : 'bg-slate-950/60 border border-cyan-500/10 text-cyan-100'}`}>
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-[9px] text-slate-500 mt-2 text-right opacity-50 uppercase tracking-wider">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    
                                    {/* Suggestions Chips */}
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-2 animate-in fade-in slide-in-up duration-500 delay-300">
                                            {msg.suggestions.map((s, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => sendMessage(s)}
                                                    disabled={isChatTyping}
                                                    className="text-[10px] text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 rounded-full hover:bg-cyan-500/20 hover:border-cyan-400 transition-all font-mono uppercase tracking-wide text-left flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span>{s}</span>
                                                    <Send className="w-2.5 h-2.5 opacity-50" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isChatTyping && (
                            <div className="flex gap-4 animate-in fade-in">
                                <div className="w-8 h-8 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-cyan-500" />
                                </div>
                                <div className="flex items-center gap-1 h-10 px-3 bg-slate-950/30 rounded border border-slate-800">
                                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-5 bg-slate-950/50 border-t border-slate-800">
                        <form onSubmit={handleSendChatMessage} className="flex gap-3">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask specific questions about the case file..."
                                className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-sm text-white font-mono focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
                                disabled={isChatTyping}
                            />
                            <button 
                                type="submit" 
                                disabled={!chatInput.trim() || isChatTyping}
                                className="px-6 bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/60 transition-colors rounded-lg disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            );
        case 'interrogate':
            return (
                <div className="w-full animate-in slide-in-right duration-700 relative z-10">
                     <form onSubmit={handleGenerate} className="glass-panel p-6 md:p-8 rounded-xl flex flex-col gap-6">
                        
                        <div className="flex items-center justify-between mb-2">
                             <button type="button" onClick={() => setWorkflowStep('review')} className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors text-xs font-bold uppercase tracking-widest">
                                <ArrowLeft className="w-3 h-3" /> Back
                             </button>
                             <span className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest flex items-center gap-2 bg-cyan-950/30 px-3 py-1 rounded border border-cyan-500/20">
                                <Lock className="w-3 h-3" /> Secure Channel
                             </span>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block pl-1">Interrogation Query (Visual Generation)</label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
                                <textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter specific question for visualization (e.g., 'Reconstruct the crash scene at the intersection')..."
                                    rows={4}
                                    className="relative w-full p-5 bg-slate-950/80 rounded-lg border border-slate-700 focus:border-cyan-500/50 outline-none text-base text-white placeholder:text-slate-600 resize-none font-mono transition-colors"
                                />
                                <div className="absolute bottom-4 right-4 text-cyan-500/30">
                                    <Search className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800">
                            <button
                                type="button"
                                onClick={() => toggleMediaType('image')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mediaType === 'image' ? 'bg-slate-800 text-cyan-400 shadow-lg border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <ImageIcon className="w-3 h-3" /> Evidence Visual
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleMediaType('video')}
                                className={`flex items-center justify-center gap-2 py-3 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mediaType === 'video' ? 'bg-slate-800 text-red-400 shadow-lg border border-red-500/30' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <Video className="w-3 h-3" /> Reconstruction
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                             <div className="bg-slate-950/40 rounded-lg border border-slate-800 px-4 py-3 hover:border-slate-600 transition-colors">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Response Tone</label>
                                <select 
                                    value={tone} 
                                    onChange={(e) => setTone(e.target.value as Tone)}
                                    className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 cursor-pointer p-0 w-full hover:text-cyan-400 transition-colors uppercase [&>option]:bg-slate-900"
                                >
                                    <option value="Objective">Objective</option>
                                    <option value="Skeptical">Skeptical</option>
                                    <option value="Aggressive">Aggressive</option>
                                    <option value="Formal">Formal</option>
                                    <option value="Empathetic">Empathetic</option>
                                </select>
                            </div>

                            <div className="bg-slate-950/40 rounded-lg border border-slate-800 px-4 py-3 hover:border-slate-600 transition-colors">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Visual Evidence</label>
                                <select 
                                    value={evidenceStyle} 
                                    onChange={(e) => setEvidenceStyle(e.target.value as EvidenceType)}
                                    className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 cursor-pointer p-0 w-full hover:text-cyan-400 transition-colors uppercase [&>option]:bg-slate-900"
                                >
                                    <option value="Crime Scene Sketch">Scene Sketch</option>
                                    <option value="CCTV Footage">CCTV</option>
                                    <option value="Technical Diagram">Diagram</option>
                                    <option value="Map Visualization">Tactical Map</option>
                                    <option value="Photorealistic">Photo Evidence</option>
                                    <option value="Blueprint">Blueprint</option>
                                    <option value="Timeline Visualization">Timeline</option>
                                </select>
                            </div>

                             <div className="bg-slate-950/40 rounded-lg border border-slate-800 px-4 py-3 hover:border-slate-600 transition-colors">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Language</label>
                                <select 
                                    value={language} 
                                    onChange={(e) => setLanguage(e.target.value as Language)}
                                    className="bg-transparent border-none text-xs font-bold text-white focus:ring-0 cursor-pointer p-0 w-full hover:text-cyan-400 transition-colors uppercase [&>option]:bg-slate-900"
                                >
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Mandarin">Mandarin</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full mt-2 btn-primary py-5 rounded-lg font-bold font-display tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm ${mediaType === 'video' ? 'bg-red-950/50 hover:bg-red-900/60 border-red-500/40 text-red-100' : ''}`}
                        >
                            {mediaType === 'video' ? <Video className="w-5 h-5" /> : <Gavel className="w-5 h-5" />}
                            <span>{mediaType === 'video' ? 'Generate Reconstruction' : 'Execute Interrogation'}</span>
                        </button>
                    </form>
                </div>
            );
        case 'view':
            return null;
    }
  };

  return (
    <>
    {!checkingKey && !hasApiKey && <KeySelectionModal />}
    {isDocModalOpen && <DocumentModal />}

    {showIntro ? (
      <IntroScreen onComplete={() => setShowIntro(false)} />
    ) : (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20 relative overflow-x-hidden animate-in fade-in duration-1000">
      
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-black"></div>
        <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[length:40px_40px]"></div>
        <div className="fixed inset-0 overflow-hidden">
             <div className="animate-scanline"></div>
        </div>
      </div>
      
      {/* Header */}
      <header className="border-b border-slate-800/60 sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => { setWorkflowStep('upload'); setContentHistory([]); }}>
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="bg-slate-900 p-2.5 border border-cyan-500/30 rounded-lg relative z-10 shadow-lg">
                   <Shield className="w-6 h-6 text-cyan-400" />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="font-display font-bold text-lg md:text-xl tracking-widest text-white leading-none uppercase text-glow-sm">
                Case File <span className="text-cyan-400">Interrogator</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-mono mt-1">Secure RAG System v3.1</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
              <button 
                onClick={handleSelectKey}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 text-[10px] font-mono transition-colors border border-slate-800 hover:border-cyan-500/30 uppercase tracking-wider"
              >
                <Key className="w-3 h-3" />
                <span>Credentials</span>
              </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-8 md:py-12 relative z-10">
        
        <div className={`max-w-4xl mx-auto transition-all duration-700 ease-in-out ${contentHistory.length > 0 ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center'}`}>
          
          {!contentHistory.length && workflowStep === 'upload' && (
            <div className="text-center mb-10 md:mb-16 space-y-6 animate-in slide-in-up duration-1000 fade-in">
              <div className="inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                Ready for Analysis
              </div>
              
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white tracking-wider uppercase text-glow">
                AI Legal <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-200">Investigator</span>
              </h1>
              
              <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed font-mono">
                Upload case files to extract key evidence, generate timelines, and simulate crime scenes using advanced computer vision and reasoning models.
              </p>
            </div>
          )}

          {/* Main Content Area */}
          {isLoading ? (
             <Loading status={loadingMessage} step={loadingStep} facts={loadingEntities} />
          ) : (
             renderStepContent()
          )}

        </div>

        {/* Content History / Results View */}
        {workflowStep === 'view' && contentHistory.length > 0 && (
           <div className="space-y-12">
              {contentHistory.map(content => (
                 <Infographic 
                    key={content.id} 
                    content={content} 
                    onEdit={handleEdit}
                    isEditing={isLoading && loadingStep === 2}
                 />
              ))}
              
              {currentSearchResults.length > 0 && (
                  <SearchResults results={currentSearchResults} />
              )}
           </div>
        )}

      </main>
    </div>
    )}
    </>
  );
};

export default App;

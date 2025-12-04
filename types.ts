
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export type ImageResolution = '1K' | '2K' | '4K';
export type VideoResolution = '720p' | '1080p';

export type MediaType = 'image' | 'video';

export type Tone = 'Objective' | 'Skeptical' | 'Aggressive' | 'Formal' | 'Empathetic';

export type EvidenceType = 'Crime Scene Sketch' | 'CCTV Footage' | 'Technical Diagram' | 'Map Visualization' | 'Photorealistic' | 'Abstract Network' | 'Vintage Photo' | 'Blueprint' | 'Timeline Visualization' | 'Strengths & Weaknesses Visualization' | 'Investigative Mind Map';

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Mandarin' | 'Japanese' | 'Hindi' | 'Arabic' | 'Portuguese' | 'Russian';

export type AnalysisDepth = 'Initial Case Assessment' | 'Medical Chronology' | 'Liability & Negligence' | 'Witness Credibility' | 'Settlement Valuation' | 'Bias & Fact Separation' | "Liar's List" | 'Witness Bias Detection';

export type DocumentType = 'Internal Case Memo' | 'Demand Letter' | 'Client Status Update' | 'Motion in Limine (Draft)' | 'Deposition Questions Outline';

export type WorkflowStep = 'upload' | 'dashboard';

export type AssetTab = 'analysis' | 'visuals' | 'documents' | 'graph';

export type ViewMode = 'technical' | 'reader';

export interface GeneratedContent {
  id: string;
  type: MediaType;
  data: string;
  prompt: string;
  answer?: string;
  timestamp: number;
  tone?: Tone;
  style?: EvidenceType;
  language?: Language;
  aspectRatio?: AspectRatio;
  resolution?: string;
  videoMetadata?: any;
}

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface InterrogationResult {
  answer: string;
  visualPrompt: string;
  keyEntities: string[];
  searchResults: SearchResultItem[];
}

export interface StreamComponent {
  type: 'analysis_result' | 'visual_generated' | 'doc_generated' | 'suggestion_chips' | 'auto_protocol_start';
  data: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  suggestions?: string[];
  component?: StreamComponent; // UI Widget embedded in message
}

export interface CaseSummary {
  parties: string;
  incidentType: string;
  date: string;
  jurisdiction: string;
  synopsis: string;
  tags: string[];
}

export interface FindingAsset {
  id: string;
  title: string;
  type: AnalysisDepth | 'General Discovery';
  items: string[];
  timestamp: number;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  type: DocumentType;
  content: string;
  timestamp: number;
}

// Mind Map Types
export type NodeType = 'case' | 'person' | 'evidence' | 'location' | 'event' | 'statute';

export interface NodeMetadata {
    role?: string; // e.g. "Plaintiff", "Hostile Witness"
    impactScore?: number; // 1-10 relevance
    tags?: string[];
    keyQuote?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: NodeType;
  description: string;
  metadata?: NodeMetadata; // Enhanced Data
  color?: string;
  x?: number;
  y?: number;
}

export interface MindMapEdge {
  source: string;
  target: string;
  relation: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface CaseFile {
  id: string;
  fileName: string;
  fileBase64: string;
  mimeType: string;
  uploadTimestamp: number;
  summary: CaseSummary | null;
  findings: FindingAsset[];
  chatHistory: ChatMessage[];
  visuals: GeneratedContent[];
  documents: GeneratedDocument[];
  mindMap: MindMapData | null;
}

export interface VisualFilter {
    subject?: string;
    evidenceType?: EvidenceType;
    timePeriod?: string;
}

export interface CaseContextDetection {
    caseType: string;
    recommendedProtocols: AnalysisDepth[];
    reasoning: string;
}

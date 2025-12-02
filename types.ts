
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export type ImageResolution = '1K' | '2K' | '4K';
export type VideoResolution = '720p' | '1080p';

export type MediaType = 'image' | 'video';

export type Tone = 'Objective' | 'Skeptical' | 'Aggressive' | 'Formal' | 'Empathetic';

export type EvidenceType = 'Crime Scene Sketch' | 'CCTV Footage' | 'Technical Diagram' | 'Map Visualization' | 'Photorealistic' | 'Abstract Network' | 'Vintage Photo' | 'Blueprint' | 'Timeline Visualization';

export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Mandarin' | 'Japanese' | 'Hindi' | 'Arabic' | 'Portuguese' | 'Russian';

export type AnalysisDepth = 'Initial Case Assessment' | 'Medical Chronology' | 'Liability & Negligence' | 'Witness Credibility' | 'Settlement Valuation' | 'Bias & Fact Separation' | "Liar's List";

export type DocumentType = 'Internal Case Memo' | 'Demand Letter' | 'Client Status Update' | 'Motion in Limine (Draft)' | 'Deposition Questions Outline';

export type WorkflowStep = 'upload' | 'review' | 'interrogate' | 'chat' | 'view';

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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  suggestions?: string[];
}

export interface CaseSummary {
  parties: string;
  incidentType: string;
  date: string;
  jurisdiction: string;
  synopsis: string;
  tags: string[];
}

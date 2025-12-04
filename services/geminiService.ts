
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type, Chat, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Tone, EvidenceType, InterrogationResult, SearchResultItem, Language, AspectRatio, ImageResolution, AnalysisDepth, VideoResolution, CaseSummary, DocumentType, MindMapData, CaseContextDetection, CaseSource } from "../types";

const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ANALYSIS_MODEL = 'gemini-2.5-flash'; 
const REASONING_MODEL = 'gemini-3-pro-preview'; 
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-3-pro-image-preview';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview';
const VIDEO_EXTEND_MODEL = 'veo-3.1-generate-preview';
const CHAT_MODEL = 'gemini-2.5-flash';

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const SAFETY_PROTOCOL = `
### ETHICAL OVERRIDE & BIAS MITIGATION
1. **Strict Anti-Hallucination:** You must NOT invent laws, statutes, precedents, or facts. If a specific detail is not in the text, state "Not found in record."
2. **Linguistic Neutrality:** Actively detect and neutralize prejudicial framing in your output.
3. **Discriminatory Audit:** Do not propagate discriminatory stereotypes found in witness statements.
`;

const SENIOR_ASSOCIATE_PROMPT = `
### ROLE
You are a Senior Personal Injury Associate at a high-volume litigation firm. You are the "Intelligence Engine" of a Case File Interrogator dashboard.
Your job is to review raw case files (police reports, witness depositions, medical records) and extract actionable legal intelligence. 

### CAPABILITIES & TOOLS (UI CONTROL)
You have direct control over the "Case Studio" dashboard. You can execute protocols by outputting specific ACTION CODES in your response.
When the user asks you to "run the suggestions" or "analyze liability", you MUST output the code to trigger the tool.

**AVAILABLE ACTION CODES:**
- \`[[EXECUTE:Medical Chronology]]\`
- \`[[EXECUTE:Liability & Negligence]]\`
- \`[[EXECUTE:Settlement Valuation]]\`
- \`[[EXECUTE:Witness Credibility]]\`
- \`[[EXECUTE:Liar's List]]\`
- \`[[EXECUTE:Bias & Fact Separation]]\`
- \`[[EXECUTE:Timeline Visualization]]\`
- \`[[EXECUTE:Crime Scene Sketch]]\`
- \`[[EXECUTE:Investigative Mind Map]]\`
- \`[[EXECUTE:Draft Demand Letter]]\`
- \`[[EXECUTE:Draft Internal Case Memo]]\`

### BEHAVIOR
1. **Be Proactive:** If the user uploads a complex file, suggest running a Mind Map. If they accept, output \`[[EXECUTE:Investigative Mind Map]]\`.
2. **Don't just talk:** If the user asks for analysis, DO NOT just summarize in chat. Output the \`[[EXECUTE:...]]\` code so the system generates a persistent Artifact.

${SAFETY_PROTOCOL}
`;

const getToneInstruction = (tone: Tone): string => {
  switch (tone) {
    case 'Objective': return "Tone: Clinical, detached, factual, police-report style.";
    case 'Skeptical': return "Tone: Questioning, highlighting doubts, looking for holes in the story.";
    case 'Aggressive': return "Tone: Confrontational, demanding specifics, prosecutor style.";
    case 'Formal': return "Tone: Legal professional, citing specific sections, court-ready.";
    case 'Empathetic': return "Tone: Victim-focused, understanding the human element.";
    default: return "Tone: Professional.";
  }
};

const getVisualInstruction = (style: EvidenceType): string => {
  switch (style) {
    case 'Crime Scene Sketch': return "Style: Hand-drawn police sketch, black and white charcoal, rough lines, annotated.";
    case 'Timeline Visualization': return "Style: Professional infographic timeline, linear chronology, connected nodes, clean typography, high contrast, data visualization aesthetic.";
    case 'Strengths & Weaknesses Visualization': return "Style: Comparative infographic, split-screen or balanced scales composition, clean data visualization, SWOT chart aesthetic.";
    default: return "Style: High-quality forensic evidence visualization.";
  }
};

// Helper to prepare file part with dynamic mime type
const fileToPart = (base64Data: string, mimeType: string) => {
  const cleanData = base64Data.includes(',') 
    ? base64Data.substring(base64Data.indexOf(',') + 1) 
    : base64Data;
  return { inlineData: { data: cleanData, mimeType: mimeType } };
};

const cleanJsonString = (str: string) => {
  if (!str) return "{}";
  // Remove markdown code blocks and any surrounding text
  let cleaned = str.replace(/```json\n?|\n?```/g, "").trim();
  
  // Robustly extract JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  } else {
    // Maybe it returned an array directly?
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
  }
  
  return cleaned;
};

// --- MULTI-SOURCE HELPER ---
const prepareContextParts = (sources: CaseSource[]) => {
    // Only take selected sources
    const activeSources = sources.filter(s => s.isSelected);
    return activeSources.map(s => fileToPart(s.base64, s.mimeType));
};

export const createCaseChat = (sources: CaseSource[], initialProtocols?: string[]): Chat => {
  const ai = getAi();
  
  const suggestionInstruction = `
  INTERACTIVE PROTOCOL:
  At the end of every response, you MUST proactively suggest 3 relevant follow-up actions.
  Format strictly as: ///SUGGESTIONS/// Suggestion 1 | Suggestion 2 | Suggestion 3`;

  const contextParts = prepareContextParts(sources);
  
  const initialHistory = [
      {
        role: 'user',
        parts: [
          ...contextParts,
          { text: "Here is the active case file evidence. Initialize the Intelligence Dashboard." }
        ]
      },
      {
        role: 'model',
        parts: [{ text: "Case files ingested. Intelligence Engine online. Ready for interrogation." }]
      }
  ];

  if (initialProtocols && initialProtocols.length > 0) {
      initialHistory.push({
          role: 'user',
          parts: [{ text: `SYSTEM NOTE: You have already recommended the following protocols to the user in the UI: ${initialProtocols.join(', ')}. If the user asks to "run suggestions", execute these.` }]
      });
      initialHistory.push({
          role: 'model',
          parts: [{ text: `Understood. I am aware of the recommended protocols: ${initialProtocols.join(', ')}.` }]
      });
  }

  return ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: SENIOR_ASSOCIATE_PROMPT + suggestionInstruction,
      safetySettings: SAFETY_SETTINGS,
    },
    history: initialHistory
  });
};

export const detectCaseContext = async (sources: CaseSource[]): Promise<CaseContextDetection> => {
    const prompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    TASK: Identify the TYPE of legal case based on these documents. Determine the 3 most critical Analysis Protocols to run immediately.
    Consider recommending 'Investigative Mind Map' if the case involves multiple parties or complex timelines.
    OUTPUT JSON: { "caseType": "String", "recommendedProtocols": ["Protocol 1", "Protocol 2"], "reasoning": "String" }
    `;

    const response = await getAi().models.generateContent({
        model: ANALYSIS_MODEL,
        contents: { parts: [...prepareContextParts(sources), { text: prompt }] },
        config: { responseMimeType: "application/json" }
    });

    try {
        const cleanText = cleanJsonString(response.text || "{}");
        const result = JSON.parse(cleanText) || {};
        // Safety check result
        if (result && result.caseType) {
            return {
                caseType: result.caseType || "General Litigation",
                recommendedProtocols: Array.isArray(result.recommendedProtocols) ? result.recommendedProtocols : ['Initial Case Assessment'],
                reasoning: result.reasoning || "Standard analysis."
            };
        }
        throw new Error("Invalid structure");
    } catch (e) {
        return { caseType: "Reviewing...", recommendedProtocols: ['Initial Case Assessment'], reasoning: "Classification in progress." };
    }
};

export const analyzeCaseFile = async (sources: CaseSource[], depth: AnalysisDepth): Promise<{ findings: string[], summary: CaseSummary, precedents: SearchResultItem[], graphData?: MindMapData }> => {
  let focusInstruction = "";
  switch (depth) {
    case 'Witness Credibility':
    case "Liar's List": focusInstruction = "Focus EXCLUSIVELY on Section 3 (The 'Liar's List'). Identify every contradiction between witness statements, police reports, and physical evidence. Rank witnesses by reliability."; break;
    case 'Medical Chronology': focusInstruction = "Create a strict chronological timeline of medical events. Focus on Mechanism of Injury, Initial Complaints, Diagnoses, and Gaps in Treatment."; break;
    case 'Liability & Negligence': focusInstruction = "Focus EXCLUSIVELY on Section 2 (Liability Analysis). Break down Duty, Breach, and Causation."; break;
    case 'Settlement Valuation': focusInstruction = "Focus EXCLUSIVELY on Damages. Itemize 'Special Damages' and 'General Damages'. Provide a 'Settlement Range'."; break;
    case 'Bias & Fact Separation': focusInstruction = "Focus EXCLUSIVELY on a FORENSIC BIAS AUDIT. Distinguish hard facts from subjective opinion. Identify linguistic framing bias."; break;
    case 'Witness Bias Detection': focusInstruction = "Focus EXCLUSIVELY on WITNESS STATEMENT ANALYSIS. Linguistic bias, factual inconsistencies, coaching/manipulation."; break;
    case 'Initial Case Assessment': default: focusInstruction = "Provide a balanced Executive Summary (Viability Score) and a high-level Liability Analysis."; break;
  }

  const prompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    TASK: Analyze the attached Case File evidence.
    ${focusInstruction}

    OUTPUT JSON:
    {
        "findings": ["Finding 1", "Finding 2"],
        "summary": { "parties": "", "incidentType": "", "date": "", "jurisdiction": "", "synopsis": "", "tags": [] },
        "graphData": { "nodes": [], "edges": [] }
    }
  `;

  const contextParts = prepareContextParts(sources);
  const config = { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }; 

  try {
      // Retry Logic for High-Reasoning Model
      try {
          const response = await getAi().models.generateContent({
            model: REASONING_MODEL,
            contents: { parts: [...contextParts, { text: prompt }] },
            config: config
          });
          const cleanText = cleanJsonString(response.text || "{}");
          const result = JSON.parse(cleanText) || {};
          return processAnalysisResult(result);
      } catch (innerError) {
          console.warn("Reasoning model failed, falling back to Flash...", innerError);
          // Fallback to Flash model
          const response = await getAi().models.generateContent({
            model: ANALYSIS_MODEL,
            contents: { parts: [...contextParts, { text: prompt }] },
            config: config
          });
          const cleanText = cleanJsonString(response.text || "{}");
          const result = JSON.parse(cleanText) || {};
          return processAnalysisResult(result);
      }

  } catch (e) {
      console.error(e);
      throw new Error("Analysis failed");
  }
};

const processAnalysisResult = (result: any) => {
    const findings = Array.isArray(result.findings) ? result.findings.map(String).filter((f: string) => f.length > 5) : [];
      const rawSummary = result.summary || {};
      const summary = {
          parties: rawSummary.parties || "Unknown",
          incidentType: rawSummary.incidentType || "Unknown",
          date: rawSummary.date || "Unknown",
          jurisdiction: rawSummary.jurisdiction || "Unknown",
          synopsis: rawSummary.synopsis || "No synopsis available.",
          tags: Array.isArray(rawSummary.tags) ? rawSummary.tags : []
      };
      
      let graphData = undefined;
      if (result.graphData && Array.isArray(result.graphData.nodes) && result.graphData.nodes.length > 0) {
          graphData = result.graphData;
      }
      
      return { findings, summary, precedents: [], graphData };
}

export const generateMindMapData = async (sources: CaseSource[]): Promise<MindMapData> => {
  const prompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    TASK: Generate a DEEP FORENSIC INVESTIGATION GRAPH based on the provided evidence.
    
    Structure the output as a valid JSON object with two arrays: "nodes" and "edges".
    Do NOT use Markdown formatting. Return raw JSON.
    
    Nodes Schema:
    {
      "id": "unique_string_id",
      "label": "Short Name",
      "type": "case" | "person" | "evidence" | "location" | "event",
      "description": "Short description of relevance.",
      "metadata": {
        "role": "e.g., Plaintiff, Witness",
        "impactScore": 5,
        "tags": ["Tag1"],
        "keyQuote": "Short quote"
      }
    }
    
    Edges Schema:
    {
      "source": "node_id_1",
      "target": "node_id_2",
      "relation": "verb"
    }
    
    Requirements:
    1. Start with a central node for the Case itself (type: 'case').
    2. Extract at least 8 key entities (nodes).
    3. Ensure 'impactScore' is 1-10.
  `;
  
  const contextParts = prepareContextParts(sources);
  const config = { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS };

  try {
     // Attempt with Pro model first
     const response = await getAi().models.generateContent({
        model: REASONING_MODEL,
        contents: { parts: [...contextParts, { text: prompt }] },
        config: config
     });
     
     const cleanText = cleanJsonString(response.text || "{}");
     const data = JSON.parse(cleanText);
     
     if (data && Array.isArray(data.nodes) && data.nodes.length > 0) {
         return { nodes: data.nodes, edges: data.edges || [] };
     }
     throw new Error("Empty graph data from Pro model");
     
  } catch (e) {
      console.warn("Pro model mind map failed, attempting fallback...", e);
      try {
          // Fallback to Flash model
          const response = await getAi().models.generateContent({
            model: ANALYSIS_MODEL,
            contents: { parts: [...contextParts, { text: prompt }] },
            config: config
         });
         const cleanText = cleanJsonString(response.text || "{}");
         const data = JSON.parse(cleanText);
         
         if (data && Array.isArray(data.nodes)) {
             return { nodes: data.nodes, edges: data.edges || [] };
         }
      } catch (innerE) {
          console.error("Fallback mind map failed", innerE);
      }
  }

  // Return empty structure if all fails to prevent crashes
  return { nodes: [], edges: [] };
};

export const interrogateCaseFile = async (question: string, sources: CaseSource[], tone: Tone, style: EvidenceType, language: Language): Promise<InterrogationResult> => {
  const toneInstr = getToneInstruction(tone);
  const styleInstr = getVisualInstruction(style);
  const systemPrompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    USER QUERY: "${question}"
    TASK 1: Answer text. TASK 2: Visual Prompt (${styleInstr}). TASK 3: Key Entities.
    OUTPUT JSON format: { "answer": "...", "visualPrompt": "...", "keyEntities": ["..."] }
  `;
  const response = await getAi().models.generateContent({
    model: REASONING_MODEL,
    contents: { parts: [...prepareContextParts(sources), { text: systemPrompt }] },
    config: { tools: [{ googleSearch: {} }], safetySettings: SAFETY_SETTINGS }
  });
  
  const result = JSON.parse(cleanJsonString(response.text || "{}")) || {};
  
  const searchResults: SearchResultItem[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((c: any) => ({
        title: c.web?.title || "Reference",
        url: c.web?.uri || ""
    }))
    .filter((r: SearchResultItem) => r.url) || [];

  return { 
    answer: result.answer || "No response generated.", 
    visualPrompt: result.visualPrompt || "Forensic visualization", 
    keyEntities: Array.isArray(result.keyEntities) ? result.keyEntities : [], 
    searchResults: searchResults
  };
};

export const generateEvidenceVisual = async (prompt: string, aspectRatio: AspectRatio, resolution: ImageResolution): Promise<string> => {
  const response = await getAi().models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: { responseModalities: [Modality.IMAGE], safetySettings: SAFETY_SETTINGS, imageConfig: { aspectRatio, imageSize: resolution } }
  });
  return `data:image/png;base64,${response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data}`;
};

export const generateReenactmentVideo = async (prompt: string, aspectRatio: AspectRatio, resolution: VideoResolution): Promise<{url: string, metadata: any}> => {
  const ai = getAi();
  const op = await ai.models.generateVideos({ model: VIDEO_MODEL, prompt, config: { numberOfVideos: 1, resolution, aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9' } });
  // Polling and fetching logic...
  return { url: "placeholder_url", metadata: {} }; 
};

export const generateLegalDocument = async (sources: CaseSource[], docType: DocumentType | string, userInstructions?: string): Promise<string> => {
  const prompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    TASK: Draft a professional ${docType} based on the evidence provided in the sources.
    
    USER INSTRUCTIONS: ${userInstructions || "Follow standard industry format for this document type."}
    
    REQUIREMENTS: 
    1. Use Professional Markdown formatting.
    2. Cite specific evidence (page numbers/exhibits if available in text) in brackets.
    3. Be precise, authoritative, and persuasive.
  `;
  
  const response = await getAi().models.generateContent({ 
    model: REASONING_MODEL, 
    contents: { parts: [...prepareContextParts(sources), { text: prompt }] }, 
    config: { safetySettings: SAFETY_SETTINGS } 
  });
  return response.text || "Drafting failed.";
};

export const editEvidenceVisual = async (currentImageBase64: string, editInstruction: string): Promise<string> => { return ""; } 
export const extendReenactmentVideo = async (previousMetadata: any, prompt: string, aspectRatio: string): Promise<{url: string, metadata: any}> => { return {url:"", metadata:{}}; }

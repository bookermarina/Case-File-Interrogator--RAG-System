
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type, Chat, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Tone, EvidenceType, InterrogationResult, SearchResultItem, Language, AspectRatio, ImageResolution, AnalysisDepth, VideoResolution, CaseSummary, DocumentType, MindMapData } from "../types";

// Create a fresh client for every request to ensure the latest API key from process.env.API_KEY is used
const getAi = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Models
const ANALYSIS_MODEL = 'gemini-2.5-flash'; 
const REASONING_MODEL = 'gemini-3-pro-preview'; 
const IMAGE_MODEL = 'gemini-3-pro-image-preview';
const EDIT_MODEL = 'gemini-3-pro-image-preview';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview';
const VIDEO_EXTEND_MODEL = 'veo-3.1-generate-preview';
const CHAT_MODEL = 'gemini-2.5-flash';

// Safety Configuration: Strict blocking for legal/professional context
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const SAFETY_PROTOCOL = `
### ETHICAL OVERRIDE & BIAS MITIGATION
1. **Strict Anti-Hallucination:** You must NOT invent laws, statutes, precedents, or facts. If a specific detail is not in the text, state "Not found in record." Do not guess dates or amounts.
2. **Linguistic Neutrality:** Actively detect and neutralize prejudicial framing in your output. (e.g., Ensure you do not describe one party's actions in passive voice to minimize responsibility while using active voice for another).
3. **Discriminatory Audit:** Do not propagate discriminatory stereotypes found in witness statements. Instead, flag them as "Potential Bias Indicators."
`;

const SENIOR_ASSOCIATE_PROMPT = `
### ROLE
You are a Senior Personal Injury Associate at a high-volume litigation firm. You are the "Intelligence Engine" of a Case File Interrogator dashboard.
Your job is to review raw case files (police reports, witness depositions, medical records) and extract actionable legal intelligence. 
You are NOT just a chatbot; you are an INVESTIGATOR commanding a suite of digital forensics tools.

### CAPABILITIES & TOOLS
You are aware that the user has access to these tools via the dashboard. You should proactively suggest them when relevant:
1. **Analysis Protocols:** (Medical Chronology, Liability Check, Settlement Valuation, Bias Audit, Liar's List).
2. **Visual Generation:** (Crime Scene Sketches, Timelines, Technical Diagrams).
3. **Document Drafting:** (Memos, Demand Letters, Motions).
4. **Mind Mapping:** (Entity relationship graphs).

### TONE & STYLE GUIDELINES
- **Be Ruthless:** If a witness sounds coached or unreliable, say so.
- **No Fluff:** Do not use phrases like "The document mentions..." Just state the fact.
- **Citations:** Every fact MUST end with a reference (e.g., [Page 4, Paragraph 2]).

${SAFETY_PROTOCOL}
`;

const getToneInstruction = (tone: Tone): string => {
  switch (tone) {
    case 'Objective': return "Tone: Clinical, detached, factual, police-report style.";
    case 'Skeptical': return "Tone: Questioning, highlighting doubts, looking for holes in the story.";
    case 'Aggressive': return "Tone: Confrontational, demanding specifics, prosecutor style.";
    case 'Formal': return "Tone: Legal professional, citing specific sections, court-ready.";
    case 'Empathetic': return "Tone: Victim-focused, understanding the human element (but maintaining professional distance).";
    default: return "Tone: Professional.";
  }
};

const getVisualInstruction = (style: EvidenceType): string => {
  switch (style) {
    case 'Crime Scene Sketch': return "Style: Hand-drawn police sketch, black and white charcoal, rough lines, annotated.";
    case 'CCTV Footage': return "Style: Grainy security camera footage, timestamp overlay, wide angle, high contrast, low light.";
    case 'Technical Diagram': return "Style: Clean vector schematic, isometric view, blueprints, precise measurements.";
    case 'Map Visualization': return "Style: Satellite view overlay, tactical map markings, route tracing, red strings.";
    case 'Photorealistic': return "Style: Highly detailed forensic photography, flash photography lighting, crime scene tape.";
    case 'Abstract Network': return "Style: Data visualization, nodes and connections, cyber-security aesthetic, glowing lines.";
    case 'Vintage Photo': return "Style: Old evidence photo, sepia or black and white, physical wear, paper texture.";
    case 'Blueprint': return "Style: Architectural blueprint, cyanotype, white lines on blue.";
    case 'Timeline Visualization': return "Style: Professional infographic timeline, linear chronology, connected nodes, clean typography, high contrast, data visualization aesthetic.";
    case 'Strengths & Weaknesses Visualization': return "Style: Comparative infographic, split-screen or balanced scales composition, distinct color coding (e.g., Blue for Strength, Red for Weakness), clean data visualization, SWOT chart aesthetic.";
    case 'Investigative Mind Map': return "Style: Complex node-link diagram, dark background, glowing connectors, digital forensic aesthetic, centralized case node.";
    default: return "Style: High-quality evidence visualization.";
  }
};

// Helper to prepare file part with dynamic mime type
const fileToPart = (base64Data: string, mimeType: string) => {
  // Remove header if present to get clean base64
  const cleanData = base64Data.includes(',') 
    ? base64Data.substring(base64Data.indexOf(',') + 1) 
    : base64Data;
    
  return {
    inlineData: {
      data: cleanData,
      mimeType: mimeType
    }
  };
};

export const createCaseChat = (base64Data: string, mimeType: string): Chat => {
  const ai = getAi();
  
  const suggestionInstruction = `
  
  INTERACTIVE PROTOCOL:
  At the end of every response, you MUST proactively suggest 3 relevant follow-up actions or questions.
  These can be simple questions OR commands to use your tools (e.g., "Generate Timeline", "Draft Demand Letter").
  
  Format strictly as:
  ///SUGGESTIONS/// Suggestion 1 | Suggestion 2 | Suggestion 3`;

  return ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: SENIOR_ASSOCIATE_PROMPT + suggestionInstruction,
      safetySettings: SAFETY_SETTINGS,
    },
    history: [
      {
        role: 'user',
        parts: [
          fileToPart(base64Data, mimeType),
          { text: "Here is the case file/evidence. Initialize the Intelligence Dashboard." }
        ]
      },
      {
        role: 'model',
        parts: [{ text: "Case file secure. Intelligence Engine online. I have performed a preliminary scan. I am ready to execute analysis protocols, generate visual reconstructions, or draft legal documents at your command." }]
      }
    ]
  });
};

export const analyzeCaseFile = async (base64Data: string, mimeType: string, depth: AnalysisDepth): Promise<{ findings: string[], summary: CaseSummary, precedents: SearchResultItem[] }> => {
  // Map the UI depth selection to the Golden Chain framework focus areas
  let focusInstruction = "";
  switch (depth) {
    case 'Witness Credibility':
    case "Liar's List":
      focusInstruction = "Focus EXCLUSIVELY on Section 3 (The 'Liar's List'). Identify every contradiction between witness statements, police reports, and physical evidence. Rank witnesses by reliability.";
      break;
    case 'Medical Chronology':
      focusInstruction = "Create a strict chronological timeline of medical events. Focus on Mechanism of Injury, Initial Complaints, Diagnoses, and Gaps in Treatment. Flag pre-existing conditions.";
      break;
    case 'Liability & Negligence':
      focusInstruction = "Focus EXCLUSIVELY on Section 2 (Liability Analysis). Break down Duty, Breach, and Causation. Cite statutes or standard of care violations if apparent.";
      break;
    case 'Settlement Valuation':
      focusInstruction = "Focus EXCLUSIVELY on Damages. 1. Itemize 'Special Damages' (Medical bills, lost wages) with estimated costs. 2. Calculate 'General Damages' (Pain and suffering) using standard multipliers (1.5x - 5x). 3. Identify 'Aggravating Factors' (DUI, Gross Negligence) that drive up value. 4. Provide a 'Settlement Range' (Low/Mid/High).";
      break;
    case 'Bias & Fact Separation':
      focusInstruction = `
      Focus EXCLUSIVELY on a FORENSIC BIAS AUDIT. Identify three forms of bias:
      1. **Subjective vs. Objective:** Distinguish hard facts (timestamps, measurements) from subjective opinion or speculation.
      2. **Linguistic & Framing Bias:** Identify if language minimizes one party's actions (e.g., passive voice) while emphasizing another's. Flag biased vocabulary in reports.
      3. **Systemic/Outcome Bias:** Flag any demographic-based assumptions, discriminatory stereotypes, or uneven application of procedure based on identity found in the source text.
      `;
      break;
    case 'Witness Bias Detection':
      focusInstruction = `
      Focus EXCLUSIVELY on WITNESS STATEMENT ANALYSIS.
      1. **Linguistic Bias:** Analyze word choices (e.g., 'smashed' vs 'contacted'). Does the witness use passive voice to deflect blame?
      2. **Factual Inconsistencies:** Identify statements that contradict physical evidence or established timelines.
      3. **Coaching/Manipulation:** Look for unnatural phrasing, overly specific details after long periods, or identical phrases used by multiple witnesses.
      `;
      break;
    case 'Initial Case Assessment':
    default:
      focusInstruction = "Provide a balanced Executive Summary (Viability Score) and a high-level Liability Analysis. Identify the top 3 critical strengths and top 3 critical weaknesses.";
      break;
  }

  const prompt = `
    ${SENIOR_ASSOCIATE_PROMPT}

    TASK:
    Analyze the attached Case File (${mimeType}) using the persona and framework above.
    ${focusInstruction}

    OUTPUT:
    Return a JSON Object with two top-level keys:
    1. "findings": An Array of 6-8 strings. Each string must be a distinct, critical insight or finding formatted like "HEADER: Key fact or insight... [Citation]".
    2. "summary": An Object containing the case metadata: "parties" (e.g. Plaintiff v Defendant), "incidentType" (e.g. Auto Accident), "date", "jurisdiction", "synopsis" (A concise executive summary of the case status and key pivot points, approx 2-3 sentences), and "tags" (An array of 3-5 relevant short keywords or legal categories for indexing, e.g. 'Negligence', 'DUI', 'High Value').

    Ensure the response is valid JSON.
  `;

  // Step 1: Text Analysis (Flash Model)
  const response = await getAi().models.generateContent({
    model: ANALYSIS_MODEL,
    contents: {
      parts: [
        fileToPart(base64Data, mimeType),
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      safetySettings: SAFETY_SETTINGS,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: {
                type: Type.OBJECT,
                properties: {
                    parties: { type: Type.STRING },
                    incidentType: { type: Type.STRING },
                    date: { type: Type.STRING },
                    jurisdiction: { type: Type.STRING },
                    synopsis: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
      }
    }
  });
  
  let result;
  let summary: CaseSummary;
  let findings: string[] = [];

  try {
    result = JSON.parse(response.text || "{}");
    findings = Array.isArray(result.findings) ? result.findings.map(String).filter((f: string) => f.length > 5) : [];
    summary = result.summary || { parties: "Unknown", incidentType: "Unknown", date: "Unknown", jurisdiction: "Unknown", synopsis: "Analysis incomplete.", tags: [] };
  } catch (e) {
    console.error("Failed to parse analysis", e);
    return {
        findings: ["Error parsing case file or content blocked by safety filters."],
        summary: { parties: "N/A", incidentType: "N/A", date: "N/A", jurisdiction: "N/A", synopsis: "Error extracting summary.", tags: [] },
        precedents: []
    };
  }

  // Step 2: Legal Precedent Search (Reasoning Model with Search Tools)
  let precedents: SearchResultItem[] = [];
  if (summary.incidentType && summary.incidentType !== "Unknown" && summary.jurisdiction && summary.jurisdiction !== "Unknown") {
      try {
          const precedentPrompt = `Find 4 specific case law precedents relevant to a ${summary.incidentType} case in ${summary.jurisdiction} focusing on ${depth === 'Initial Case Assessment' ? 'liability and damages' : depth}. List case names and citations.`;
          
          const searchResponse = await getAi().models.generateContent({
              model: REASONING_MODEL,
              contents: {
                  parts: [{ text: precedentPrompt }]
              },
              config: {
                  tools: [{ googleSearch: {} }],
                  safetySettings: SAFETY_SETTINGS,
              }
          });
          
          // Extract Grounding Chunks
          const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (chunks) {
            chunks.forEach(chunk => {
                if (chunk.web?.uri && chunk.web?.title) {
                    precedents.push({
                        title: chunk.web.title,
                        url: chunk.web.uri
                    });
                }
            });
          }
      } catch (e) {
          console.warn("Precedent search failed:", e);
      }
  }
  
  const uniquePrecedents = Array.from(new Map(precedents.map(item => [item.url, item])).values());

  return { findings, summary, precedents: uniquePrecedents };
};

export const generateMindMapData = async (base64Data: string, mimeType: string): Promise<MindMapData> => {
  const prompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    
    TASK:
    Analyze the case file and extract specific Entities (People, Key Evidence, Locations, Events) and their relationships to create an Investigative Mind Map (Node-Link Graph).
    
    Requirements:
    1. Identify the 'Case' as the central root node.
    2. Identify 4-8 key nodes directly related to the case (e.g. The Plaintiff, The Defendant, The Crash Site).
    3. Identify secondary nodes connected to those key nodes.
    4. Define the relationships (edges) between them.
    
    OUTPUT:
    Return a JSON object:
    {
      "nodes": [{ "id": "1", "label": "Short Label", "type": "case|person|evidence|location|event", "description": "Short details..." }],
      "edges": [{ "source": "1", "target": "2", "relation": "relationship label" }]
    }
  `;

  const response = await getAi().models.generateContent({
    model: ANALYSIS_MODEL,
    contents: {
      parts: [
        fileToPart(base64Data, mimeType),
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      safetySettings: SAFETY_SETTINGS,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
              }
            } 
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relation: { type: Type.STRING },
              }
            }
          }
        }
      }
    }
  });

  try {
    const data = JSON.parse(response.text || "{}");
    if (!data.nodes || !data.edges) throw new Error("Invalid graph data");
    return data as MindMapData;
  } catch (e) {
    console.error(e);
    return { nodes: [], edges: [] };
  }
};

export const interrogateCaseFile = async (
  question: string, 
  base64Data: string,
  mimeType: string,
  tone: Tone, 
  style: EvidenceType,
  language: Language
): Promise<InterrogationResult> => {
  
  const toneInstr = getToneInstruction(tone);
  const styleInstr = getVisualInstruction(style);

  const systemPrompt = `
    ${SENIOR_ASSOCIATE_PROMPT}
    
    USER QUERY: "${question}"
    
    TASK 1 (TEXT RESPONSE): 
    Answer the user's query applying the "Ruthless Senior Associate" persona. 
    - Use the Golden Chain framework if relevant (Duty/Breach/Causation).
    - Be concise, cite pages/paragraphs.
    - ${toneInstr}
    - Language: ${language}
    
    TASK 2 (VISUAL PROMPT):
    Create a detailed prompt for an AI image generator to visualize the evidence or scene discussed in your answer.
    - Style: ${styleInstr}
    
    TASK 3 (KEY ENTITIES):
    Extract key people, dates, or locations involved in this specific query.
  `;

  const response = await getAi().models.generateContent({
    model: REASONING_MODEL,
    contents: {
      parts: [
        fileToPart(base64Data, mimeType),
        { text: systemPrompt }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      safetySettings: SAFETY_SETTINGS,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            answer: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            keyEntities: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
  });

  const result = JSON.parse(response.text || "{}");
  
  const searchResults: SearchResultItem[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) {
        searchResults.push({
          title: chunk.web.title,
          url: chunk.web.uri
        });
      }
    });
  }
  const uniqueResults = Array.from(new Map(searchResults.map(item => [item.url, item])).values());

  return {
    answer: result.answer || "No conclusion reached.",
    visualPrompt: result.visualPrompt || `Visualize evidence related to: ${question}`,
    keyEntities: result.keyEntities || [],
    searchResults: uniqueResults
  };
};

export const generateEvidenceVisual = async (prompt: string, aspectRatio: AspectRatio, resolution: ImageResolution): Promise<string> => {
  const response = await getAi().models.generateContent({
    model: IMAGE_MODEL,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseModalities: [Modality.IMAGE],
      safetySettings: SAFETY_SETTINGS,
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
       return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate evidence visualization.");
};

export const generateReenactmentVideo = async (prompt: string, aspectRatio: AspectRatio, resolution: VideoResolution): Promise<{url: string, metadata: any}> => {
  const ai = getAi();
  const supportedAspectRatio = (aspectRatio === '9:16' || aspectRatio === '16:9') ? aspectRatio : '16:9';
  const videoPrompt = `Cinematic forensic reenactment, realistic, ${prompt}`;

  let operation = await ai.models.generateVideos({
    model: VIDEO_MODEL,
    prompt: videoPrompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: supportedAspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoMetadata = operation.response?.generatedVideos?.[0]?.video;

  if (!videoUri) throw new Error("Video generation failed.");

  const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return {
    url: URL.createObjectURL(blob),
    metadata: videoMetadata
  };
};

export const extendReenactmentVideo = async (previousMetadata: any, prompt: string, aspectRatio: string): Promise<{url: string, metadata: any}> => {
  const ai = getAi();
  const supportedAspectRatio = (aspectRatio === '9:16' || aspectRatio === '16:9') ? aspectRatio : '16:9';
  
  let operation = await ai.models.generateVideos({
    model: VIDEO_EXTEND_MODEL,
    prompt: prompt,
    video: previousMetadata,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: supportedAspectRatio
    }
  });

  while (!operation.done) {
     await new Promise(resolve => setTimeout(resolve, 5000));
     operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoMetadata = operation.response?.generatedVideos?.[0]?.video;
  
  if (!videoUri) throw new Error("Video extension failed.");

  const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return {
    url: URL.createObjectURL(blob),
    metadata: videoMetadata
  };
};

export const editEvidenceVisual = async (currentImageBase64: string, editInstruction: string): Promise<string> => {
  const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
  const response = await getAi().models.generateContent({
    model: EDIT_MODEL,
    contents: {
      parts: [
         { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
         { text: editInstruction }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE],
      safetySettings: SAFETY_SETTINGS,
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
       return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to edit evidence.");
};

export const generateLegalDocument = async (summary: CaseSummary, findings: string[], docType: DocumentType): Promise<string> => {
  const contextString = `
    CASE METADATA:
    Parties: ${summary.parties}
    Incident: ${summary.incidentType}
    Date: ${summary.date}
    Jurisdiction: ${summary.jurisdiction}
    Synopsis: ${summary.synopsis}

    KEY FINDINGS:
    ${findings.join('\n')}
  `;

  const prompt = `
    You are a professional Legal Drafter/Paralegal.
    Based on the case context below, draft a formal ${docType}.

    CONTEXT:
    ${contextString}

    REQUIREMENTS:
    - Format: Professional Markdown.
    - Tone: Formal, precise, authoritative.
    - Content: Incorporate the key findings relevant to the document type.

    Output the document text only.
  `;

  const response = await getAi().models.generateContent({
    model: ANALYSIS_MODEL,
    contents: { parts: [{ text: prompt }] },
    config: { safetySettings: SAFETY_SETTINGS }
  });

  return response.text || "Failed to generate document.";
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality, Type, Chat } from "@google/genai";
import { Tone, EvidenceType, InterrogationResult, SearchResultItem, Language, AspectRatio, ImageResolution, AnalysisDepth, VideoResolution, CaseSummary, DocumentType } from "../types";

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

const SENIOR_ASSOCIATE_PROMPT = `
### ROLE
You are a Senior Personal Injury Associate at a high-volume litigation firm. Your job is to review raw case files (police reports, witness depositions, medical records, photographs) and extract actionable legal intelligence. You are NOT a summarizer; you are an investigator. Your goal is to find the "smoking gun" that proves liability and maximizes settlement value.

### OBJECTIVE
Analyze the provided text/evidence (Case File) and generate a "Case Merit Assessment." You must be skeptical, precise, and citations-focused.

### ANALYSIS FRAMEWORK (THE "GOLDEN CHAIN")
You must organize your output into these exact sections:

1. **EXECUTIVE SUMMARY (The "VIABILITY SCORE")**
   - Give a score from 0-100% on how winnable this case is for the Plaintiff.
   - One sentence explaining WHY (e.g., "Strong liability due to admitted intoxication, but damages may be capped.").

2. **LIABILITY ANALYSIS (Duty -> Breach -> Causation)**
   - **Duty:** Who had the responsibility to be safe? (e.g., "Hearst had a duty not to drive drunk.")
   - **Breach:** Exact evidence they failed. Quote specific lines. (e.g., "Witness A states Hearst 'stumbled' to his car at 11:00 PM.")
   - **Causation:** Link the breach to the injury. (e.g., "The collision occurred 15 mins after departure on the direct route home.")

3. **THE "LIAR'S LIST" (Credibility Check)**
   - Compare witness statements against each other and the police report.
   - Format: [Witness Name] contradicts [Evidence] regarding [Topic].
   - *Example:* "Dana (Host) claims the party ended at 10 PM, but the Police Report notes the noise complaint call came in at 11:15 PM."

4. **DAMAGES CALCULATOR (Est.)**
   - List all physical injuries mentioned (broken bones, lacerations).
   - List all economic losses (missed work days, totaled car value).
   - *Critical:* Identify "Aggravating Factors" that increase payout (DUI, gross negligence, fleeing the scene).

5. **MISSING INTEL (The "Discovery List")**
   - What specific documents or answers are missing? (e.g., "We need the receipt from the liquor store to prove the keg size.")

### TONE & STYLE GUIDELINES
- **Be Ruthless:** If a witness sounds coached or unreliable, say so.
- **No Fluff:** Do not use phrases like "The document mentions..." Just state the fact.
- **Citations:** Every fact MUST end with a reference (e.g., [Page 4, Paragraph 2]).
- **Format:** Use Markdown tables for the Timeline.
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
  At the end of every response, you MUST proactively suggest 3 relevant follow-up questions or interrogation angles based on the evidence. 
  Format strictly as:
  ///SUGGESTIONS/// Suggestion 1 | Suggestion 2 | Suggestion 3`;

  return ai.chats.create({
    model: CHAT_MODEL,
    config: {
      systemInstruction: SENIOR_ASSOCIATE_PROMPT + suggestionInstruction,
    },
    history: [
      {
        role: 'user',
        parts: [
          fileToPart(base64Data, mimeType),
          { text: "Here is the case file/evidence. Review it and be ready for interrogation." }
        ]
      },
      {
        role: 'model',
        parts: [{ text: "Case file loaded. I have reviewed the documents. Proceed with your questions, Counsel." }]
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
      focusInstruction = "Focus EXCLUSIVELY on distinguishing objective facts from subjective opinions. For each key witness: 1. Extract 'Direct Observations' (Facts). 2. Extract 'Speculation/Opinion' (Non-facts). 3. Identify specific 'Bias Markers' (emotional language, conflict of interest).";
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
        findings: ["Error parsing case file. Please ensure the document text is readable."],
        summary: { parties: "N/A", incidentType: "N/A", date: "N/A", jurisdiction: "N/A", synopsis: "Error extracting summary.", tags: [] },
        precedents: []
    };
  }

  // Step 2: Legal Precedent Search (Reasoning Model with Search Tools)
  // Only attempt if we have valid summary data
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
                  tools: [{ googleSearch: {} }]
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
          // Continue without precedents rather than failing the whole analysis
      }
  }
  
  // Deduplicate precedents
  const uniquePrecedents = Array.from(new Map(precedents.map(item => [item.url, item])).values());

  return { findings, summary, precedents: uniquePrecedents };
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
    - Be concise, cite pages/paragraphs, and flag inconsistencies.
    - ${toneInstr}
    - Language: ${language}
    
    TASK 2 (VISUAL PROMPT):
    Create a detailed prompt for an AI image generator to visualize the evidence or scene discussed in your answer.
    - Style: ${styleInstr}
    ${style === 'Timeline Visualization' ? '- Detail: Ensure the visualization includes clear text labels for dates and short descriptions of events. Layout should be chronological (linear or Gantt).' : ''}
    
    TASK 3 (KEY ENTITIES):
    Extract key people, dates, or locations involved in this specific query.
  `;

  const response = await getAi().models.generateContent({
    model: REASONING_MODEL, // Using reasoning model for the interrogation
    contents: {
      parts: [
        fileToPart(base64Data, mimeType),
        { text: systemPrompt }
      ]
    },
    config: {
      tools: [{ googleSearch: {} }], // Use search for checking precedents if asked
      responseMimeType: "application/json",
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
  
  // Extract Grounding (Search Results) if search was used
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
  throw new Error("Failed to generate evidence visualization");
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
    }
  });
  
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData && part.inlineData.data) {
       return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to edit evidence");
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
    - Format: Professional Markdown (headers, bullet points, standard legal layout).
    - Tone: Formal, precise, authoritative (unless 'Client Status Update', which should be professional but accessible).
    - Content: Incorporate the key findings relevant to the document type.
    - If ${docType} is 'Demand Letter', include a placeholder for settlement amount if not calculated.
    - If ${docType} is 'Motion in Limine', cite standard rules of evidence generally.

    Output the document text only.
  `;

  const response = await getAi().models.generateContent({
    model: ANALYSIS_MODEL, // Flash is good for text generation
    contents: { parts: [{ text: prompt }] }
  });

  return response.text || "Failed to generate document.";
};

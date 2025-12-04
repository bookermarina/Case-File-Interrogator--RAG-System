# Case File Interrogator ⚖️

**Intelligence-First Legal Forensics System**

The **Case File Interrogator** is a secure, high-fidelity RAG (Retrieval-Augmented Generation) application designed for high-volume litigation. Acting as a "Ruthless Senior Associate," it ingests raw case files (PDFs, Images, Text) and uses advanced multimodal AI to extract actionable legal intelligence, visualize evidence, and draft court-ready documents.

---

## 🚀 Key Capabilities

### 1. Deep Forensic Analysis ("The Golden Chain")
The system uses specialized "Analysis Protocols" to break down cases:
*   **Liability & Negligence:** Analyzes Duty, Breach, and Causation.
*   **The "Liar's List":** Cross-references witness statements against police reports to identify contradictions.
*   **Medical Chronology:** Maps injuries and treatment gaps.
*   **Settlement Valuation:** Calculates Special/General damages and identifies aggravating factors.
*   **Bias Audit:** Detects linguistic framing and discriminatory outcomes in reports.

### 2. Forensic Visualization
Turn raw text into admissible-style exhibits:
*   **Evidence Visualization:** Generates crime scene sketches, technical diagrams, and blueprints.
*   **Video Reenactment:** Uses **Google Veo** to generate cinematic forensic reenactments of events.
*   **Strategy Infographics:** Visualizes SWOT analysis and case strengths/weaknesses.
*   **Interactive Timelines:** Chronological visual frameworks of key events.

### 3. Dynamic Knowledge Graph (Investigation Board)
*   **Auto-Discovery:** Automatically detects entities (People, Evidence, Events) and their relationships.
*   **Interactive Deep Dive:** Click on nodes to "Interrogate" specific entities via the chat.
*   **Evolving Graph:** The graph updates dynamically as new analysis is performed.

### 4. Legal Document Drafting
Draft formal legal documents based on findings:
*   Internal Case Memos
*   Demand Letters
*   Deposition Questions
*   Motion in Limine Drafts

---

## 🏗 Architecture

The app follows an **"Intelligence-First"** architecture:

*   **Intelligence Stream (Left Column):** A persistent, proactive chat interface where all analysis is orchestrated. The AI suggests protocols and renders "Stream Widgets" for immediate insights.
*   **Asset Vault (Right Column):** A structured repository where every finding, visual, and document is automatically saved, timestamped, and organized.
*   **Safety & Ethics:** Implements strict `BLOCK_LOW_AND_ABOVE` safety settings and an "Ethical Override" system prompt to prevent hallucination of laws or facts.

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI Models:**
    *   `gemini-3-pro-preview` (Reasoning & Graph Construction)
    *   `gemini-2.5-flash` (High-Speed Analysis & Chat)
    *   `gemini-3-pro-image-preview` (Forensic Visualization)
    *   `veo-3.1-fast-generate-preview` (Video Reenactment)
*   **UI/UX:** Glassmorphism, Lucide Icons, Custom SVG Graphing

## 🚦 Getting Started

1.  **API Key:** This application requires a Google GenAI API Key with access to the Gemini 3 Pro and Veo models.
2.  **Upload:** Drag and drop a case file (PDF, Text, or Image).
3.  **Auto-Discovery:** The system will automatically classify the case type and recommend analysis protocols.
4.  **Interrogate:** Use the chat or Slash Commands (e.g., `/analyze liability`, `/visualize`) to investigate.

---

**Disclaimer:** This tool is for demonstration and legal assistance purposes only. It does not constitute legal advice. Always verify AI-generated citations and findings.
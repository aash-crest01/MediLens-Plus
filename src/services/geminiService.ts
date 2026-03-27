import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MedicalTerm {
  term: string;
  category: "Diagnosis" | "Lab Value" | "Medication" | "Procedure" | "Anatomy" | "Abbreviation" | "Clinical Jargon" | "Medical Terminology";
  plain_english: string;
  value: number | null;
  unit: string | null;
  reference_min: number | null;
  reference_max: number | null;
  severity: "Normal" | "Borderline" | "Concern" | "Critical" | "Informational";
  suggestion: string;
  doctor_question: string;
  citation_source: string;
  citation_url: string;
  trend?: string;
}

export interface ProcessedMedicalReport {
  terms: MedicalTerm[];
  fullText: string;
  vitality_index: number;
  executive_summary: string;
  physician_brief: string;
  doctor_questions: string[];
}

const medicalSchema = {
  type: Type.OBJECT,
  properties: {
    vitality_index: { type: Type.NUMBER, description: "A score from 0-100 based on weighted severity of findings." },
    executive_summary: { type: Type.STRING, description: "A 3-sentence narrative of the report." },
    findings_table: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Diagnosis", "Lab Value", "Medication", "Procedure", "Anatomy", "Abbreviation", "Clinical Jargon", "Medical Terminology"] },
          plain_english: { type: Type.STRING },
          value: { type: Type.NUMBER, nullable: true },
          unit: { type: Type.STRING, nullable: true },
          reference_min: { type: Type.NUMBER, nullable: true },
          reference_max: { type: Type.NUMBER, nullable: true },
          severity: { type: Type.STRING, enum: ["Normal", "Borderline", "Concern", "Critical", "Informational"] },
          suggestion: { type: Type.STRING },
          doctor_question: { type: Type.STRING },
          citation_source: { type: Type.STRING, description: "A reputable medical source like Mayo Clinic, PubMed, or NIH." },
          citation_url: { type: Type.STRING, description: "A direct URL to the medical database for validation." },
          trend: { type: Type.STRING, description: "If historical context is provided, calculate the percentage change and the 'Direction' (Improving, Declining, Stable)." },
        },
        required: ["term", "category", "plain_english", "severity", "suggestion", "doctor_question", "citation_source", "citation_url"],
      },
    },
    physician_brief: { type: Type.STRING, description: "A professional summary using SBAR format (Situation, Background, Assessment, Recommendation)." },
    doctor_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 5 targeted questions for the user to ask their provider."
    },
    fullText: {
      type: Type.STRING,
      description: "The full extracted text from the document, preserving as much layout as possible."
    }
  },
  required: ["vitality_index", "executive_summary", "findings_table", "physician_brief", "doctor_questions", "fullText"]
};

export async function extractMedicalData(
  fileData: string, 
  mimeType: string, 
  isText: boolean,
  historicalContext: string = "None",
  userSymptoms: string = "None"
): Promise<ProcessedMedicalReport> {
  const model = "gemini-3.1-pro-preview";
  
  let contentPart;
  if (isText) {
    contentPart = { text: `Analyze this medical document text:\n\n${fileData}\n\nHistorical Context: ${historicalContext}\nUser Symptoms: ${userSymptoms}` };
  } else {
    contentPart = {
      inlineData: {
        data: fileData.split(",")[1] || fileData,
        mimeType: mimeType,
      },
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents: isText ? [{ parts: [contentPart] }] : [
      { parts: [contentPart, { text: `Analyze the attached image of this medical report. Perform Aggressive Extraction of all lab markers. Compare these values to the Historical Context provided below. Generate a Physician Brief (SBAR) for my doctor. Format the final output as a Structured JSON to be consumed by my React frontend.\n\nHistorical Context: ${historicalContext}\nUser Symptoms: ${userSymptoms}` }] }
    ],
    config: {
      systemInstruction: `System Instruction: Clinical Intelligence Engine
Role: You are a Senior Clinical Data Scientist and Medical Educator. Your goal is to transform raw, messy medical data into structured, longitudinal insights for patients while providing professional summaries for clinicians.

Objective: Process uploaded medical reports (PDFs or Images) to extract every possible data point, assess clinical severity, and prepare the data for a multi-tabbed React dashboard.

1. Data Extraction & Logic (Aggressive Mode)
OCR & Extraction: Extract every lab value, unit, reference range, and clinical finding. Do not ignore "unremarkable" or "normal" results.
Severity Mapping: Categorize every finding into: Critical, Concern, Borderline, Normal, or Informational.
Jargon Translation: For every complex term, provide a "Plain English" explanation suitable for a 10-year-old.
Trend Analysis (Longitudinal): If provided with multiple sets of data (Historical Context), calculate the percentage change and the "Direction" (Improving, Declining, Stable).

2. Output Requirements (JSON Structure)
You must return a valid JSON object with the following keys to power the UI:
- vitality_index: A score from 0-100 based on weighted severity of findings.
- executive_summary: A 3-sentence narrative of the report.
- findings_table: An array of objects (see schema).
- physician_brief: A professional summary using SBAR format (Situation, Background, Assessment, Recommendation).
- doctor_questions: A list of 5 targeted questions for the user to ask their provider.
- fullText: The full extracted text.

3. Persona & Tone
Patient-Facing: Empathetic, clear, and encouraging. Use gamified language (e.g., "Knowledge Unlocked").
Physician-Facing: Cold, clinical, high-density, and professional.

Safety Guardrail: Always include a disclaimer: "This AI tool is for educational purposes only and is not a substitute for professional medical advice."`,
      responseMimeType: "application/json",
      responseSchema: medicalSchema,
    },
  });

  try {
    const parsed = JSON.parse(response.text || "{}");
    return {
      terms: parsed.findings_table || [],
      fullText: parsed.fullText || (isText ? fileData : ""),
      vitality_index: parsed.vitality_index || 0,
      executive_summary: parsed.executive_summary || "",
      physician_brief: parsed.physician_brief || "",
      doctor_questions: parsed.doctor_questions || []
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to process medical document. Please try again.");
  }
}

export async function suggestExtraQuestions(terms: MedicalTerm[]): Promise<string[]> {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Based on these medical findings: ${terms.map(t => t.term).join(", ")}, generate 3 smart, specific follow-up questions a patient should ask their doctor. Return as a JSON array of strings.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
  });

  return JSON.parse(response.text || "[]");
}

export async function translateContent(content: string, targetLanguage: string): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Translate the following medical suggestions into ${targetLanguage}. Maintain the tone and clarity. Return only the translated text.\n\n${content}`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text || content;
}

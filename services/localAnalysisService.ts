import { GoogleGenAI, Type } from "@google/genai";
import type { Subject, FinalReport, LinguisticAnalysis, Contradiction, Motive, Evidence } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set for the UI mock service.");
}

// This service uses the Gemini API to SIMULATE the behavior of the local models
// described in the PRD. The prompts are designed to make Gemini act as if it were
// a local agent querying a local database.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type UpdateProgressCallback = (stepName: string, status: 'running' | 'completed' | 'error', details?: any) => void;

// FR-003.2a: Linguistic Analysis
async function executeLinguisticAnalysis(statement: string): Promise<LinguisticAnalysis> {
    const prompt = `You are acting as a specialized local model (Qwen3:1.7B). Your task is to perform a linguistic analysis on the provided text. Analyze it for euphemisms, framing, and overall plausibility.
Text: "${statement}"
Output ONLY a valid JSON object matching the specified schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    euphemisms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    framing: { type: Type.STRING },
                    plausibility: { type: Type.STRING, description: "A brief assessment of the statement's plausibility on its own." },
                },
                required: ["euphemisms", "framing", "plausibility"],
            }
        }
    });
    return JSON.parse(response.text);
}

// FR-003.2b: Inconsistency Check
async function executeInconsistencyCheck(subject: Subject, statement: string): Promise<Contradiction[]> {
  const prompt = `You are acting as a reasoning agent (Qwen3:4B). You are analyzing a new statement from '${subject.name}'. Your task is to find contradictions by comparing the new statement against their historical data from a local vector database.
  
New Statement: "${statement}"

Historical Data for ${subject.name} (from local LanceDB):
\`\`\`json
${JSON.stringify(subject.ingestedData.slice(0, 10), null, 2)}
\`\`\`

Find up to 2 direct contradictions. For each, explain why it's a contradiction and cite the source document. If no contradictions are found, return an empty array.
Output ONLY a valid JSON object matching the specified schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sourceDocument: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, source: {type: Type.STRING}, date: {type: Type.STRING} } },
            contradictoryStatement: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["sourceDocument", "contradictoryStatement", "explanation"],
        },
      }
    }
  });
  return JSON.parse(response.text);
}

// FR-003.2c: Motive & Financial Analysis
async function executeMotiveCheck(subject: Subject, statement: string): Promise<Motive[]> {
  const prompt = `You are acting as a reasoning agent (Qwen3:4B). You are analyzing a new statement from '${subject.name}'. Your task is to identify potential financial motives or conflicts of interest by checking their historical data, especially donations and financially-related articles.

New Statement: "${statement}"

Historical Data for ${subject.name} (from local LanceDB, filtered for donations/finance):
\`\`\`json
${JSON.stringify(subject.ingestedData.filter(d => d.type === 'donation' || d.type === 'article').slice(0, 10), null, 2)}
\`\`\`

Find up to 2 potential motives or conflicts. For each, explain the connection and cite the source. If none are found, return an empty array.
Output ONLY a valid JSON object matching the specified schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sourceDocument: { type: Type.OBJECT, properties: { id: {type: Type.STRING}, source: {type: Type.STRING}, date: {type: Type.STRING}, type: {type: Type.STRING} } },
            potentialMotive: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["sourceDocument", "potentialMotive", "explanation"],
        },
      }
    }
  });
  return JSON.parse(response.text);
}


// FR-004: Report Generation
async function synthesizeReport(subjectName: string, statement: string, evidence: Evidence): Promise<string> {
  const prompt = `You are the lead analyst. Synthesize the collected evidence into a final report in Markdown format. Be neutral and cite the evidence.

**Subject:**
${subjectName}

**Analyzed Statement:**
"${statement}"

**Collected Evidence:**
*Linguistic Analysis:*
\`\`\`json
${JSON.stringify(evidence.linguisticAnalysis, null, 2)}
\`\`\`
*Inconsistency Checks:*
\`\`\`json
${JSON.stringify(evidence.inconsistencyChecks, null, 2)}
\`\`\`
*Motive Analysis:*
\`\`\`json
${JSON.stringify(evidence.motiveChecks, null, 2)}
\`\`\`

**Your Task:**
Write a comprehensive, objective report based ONLY on the provided information. Structure it with headings: ## Summary, ## Detailed Findings, and ## Potential Agenda.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
  });
  return response.text;
}

// Main analysis orchestrator
export const runAnalysis = async (subject: Subject, statement: string, updateProgress: UpdateProgressCallback): Promise<Pick<FinalReport, 'markdownReport' | 'evidence'>> => {
  const evidence: Evidence = {
    linguisticAnalysis: null,
    inconsistencyChecks: [],
    motiveChecks: [],
  };

  try {
    updateProgress('Linguistic Analysis', 'running');
    evidence.linguisticAnalysis = await executeLinguisticAnalysis(statement);
    updateProgress('Linguistic Analysis', 'completed', evidence.linguisticAnalysis);

    updateProgress('Inconsistency Check', 'running');
    evidence.inconsistencyChecks = await executeInconsistencyCheck(subject, statement);
    updateProgress('Inconsistency Check', 'completed', evidence.inconsistencyChecks);
    
    updateProgress('Motive & Financial Analysis', 'running');
    evidence.motiveChecks = await executeMotiveCheck(subject, statement);
    updateProgress('Motive & Financial Analysis', 'completed', evidence.motiveChecks);
    
    updateProgress('Synthesis & Reporting', 'running');
    const markdownReport = await synthesizeReport(subject.name, statement, evidence);
    updateProgress('Synthesis & Reporting', 'completed');

    return {
      markdownReport,
      evidence,
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    if (error instanceof Error) {
        throw new Error(`Error during analysis simulation: ${error.message}`);
    }
    throw new Error('An unknown error occurred during analysis simulation.');
  }
};
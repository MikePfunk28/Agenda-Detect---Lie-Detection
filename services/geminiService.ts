
import { GoogleGenAI, Type } from "@google/genai";
import type { FinalReport, AnalysisPlan, LinguisticAnalysis, WebSearchResult, VectorSearchResult, Evidence } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

type UpdateProgressCallback = (stepName: string, status: 'running' | 'completed' | 'error', details?: any) => void;

async function generatePlan(statement: string): Promise<AnalysisPlan> {
  const prompt = `You are an investigative analyst. Deconstruct the following statement into verifiable claims. Create a step-by-step plan to analyze its agenda. Your plan must identify which tools to use: [web_search, local_vector_search, linguistic_analysis]. For 'linguistic_analysis', the query should be the full statement. For other tools, create a concise search query.

Statement: "${statement}"

Respond with ONLY a valid JSON object matching the specified schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tool: { type: Type.STRING, description: "Tool name: web_search, local_vector_search, or linguistic_analysis" },
                query: { type: Type.STRING, description: "The query for the tool" },
              },
              required: ["tool", "query"]
            },
          },
        },
        required: ["steps"],
      },
    },
  });

  const parsedPlan = JSON.parse(response.text);
  // Ensure linguistic_analysis is always first if it exists
  parsedPlan.steps.sort((a: any, b: any) => {
    if (a.tool === 'linguistic_analysis') return -1;
    if (b.tool === 'linguistic_analysis') return 1;
    return 0;
  });
  return parsedPlan;
}

async function executeLinguisticAnalysis(statement: string): Promise<LinguisticAnalysis> {
    const prompt = `Analyze the text for euphemisms, framing, and emotional language. Be objective.
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
                    emotional_language: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["euphemisms", "framing", "emotional_language"],
            }
        }
    });
    return JSON.parse(response.text);
}

async function executeWebSearch(query: string): Promise<WebSearchResult[]> {
  const prompt = `Generate 3 plausible but fictional web search results for the query: "${query}". The results should look like real search engine snippets.
Output ONLY a valid JSON object matching the specified schema.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            snippet: { type: Type.STRING },
          },
          required: ["title", "url", "snippet"],
        },
      }
    }
  });
  return JSON.parse(response.text);
}


async function executeVectorSearch(query: string): Promise<VectorSearchResult[]> {
    const prompt = `Generate 2 plausible document chunks that would be retrieved from a local vector database for the query: "${query}". The documents could be past statements, voting records, or news articles. Keep them concise.
Output ONLY a valid JSON object matching the specified schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING, description: "e.g., 'Voting Record 2023', 'Speech Transcript 2024-05-10'" },
                        content: { type: Type.STRING, description: "The text content of the chunk." },
                    },
                    required: ["source", "content"]
                }
            }
        }
    });
    return JSON.parse(response.text);
}


async function synthesizeReport(statement: string, evidence: Evidence): Promise<string> {
  const prompt = `You are the lead analyst. Review the original statement and the collected evidence. Synthesize these findings into a final report in Markdown format. Identify any conflicts, financial incentives, or hidden agendas. Be neutral and cite the evidence provided.

**Original Statement:**
"${statement}"

**Collected Evidence:**

**1. Linguistic Analysis Report:**
\`\`\`json
${JSON.stringify(evidence.linguisticAnalysis, null, 2)}
\`\`\`

**2. Web Search Results:**
\`\`\`json
${JSON.stringify(evidence.webSearches, null, 2)}
\`\`\`

**3. Historical Documents (from Vector Search):**
\`\`\`json
${JSON.stringify(evidence.vectorSearches, null, 2)}
\`\`\`

**Your Task:**
Write a comprehensive, objective report based *only* on the information provided. Structure it with headings. Start with a summary, then detail your findings, and conclude with a potential agenda analysis.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
  });
  return response.text;
}

export const runAnalysis = async (statement: string, updateProgress: UpdateProgressCallback): Promise<FinalReport> => {
  const evidence: Evidence = {
    linguisticAnalysis: null,
    webSearches: [],
    vectorSearches: [],
  };

  try {
    // Step 1: Planning
    updateProgress('Intake & Planning', 'running');
    const plan = await generatePlan(statement);
    updateProgress('Intake & Planning', 'completed', plan);

    // Step 2: Tool Execution
    for (const step of plan.steps) {
      if (step.tool === 'linguistic_analysis') {
        updateProgress('Linguistic Analysis', 'running');
        evidence.linguisticAnalysis = await executeLinguisticAnalysis(statement);
        updateProgress('Linguistic Analysis', 'completed', evidence.linguisticAnalysis);
      } else if (step.tool === 'web_search') {
        updateProgress('Web Search', 'running');
        const results = await executeWebSearch(step.query);
        evidence.webSearches.push(...results);
        updateProgress('Web Search', 'completed', results);
      } else if (step.tool === 'local_vector_search') {
        updateProgress('Local Vector Search', 'running');
        const results = await executeVectorSearch(step.query);
        evidence.vectorSearches.push(...results);
        updateProgress('Local Vector Search', 'completed', results);
      }
    }
    
    // Step 3: Synthesis
    updateProgress('Synthesis & Reporting', 'running');
    const markdownReport = await synthesizeReport(statement, evidence);
    updateProgress('Synthesis & Reporting', 'completed');

    return {
      originalStatement: statement,
      markdownReport,
      evidence,
    };
  } catch (error) {
    console.error("Analysis failed:", error);
    if (error instanceof Error) {
        throw new Error(`Error during analysis: ${error.message}`);
    }
    throw new Error('An unknown error occurred during analysis.');
  }
};

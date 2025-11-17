import type { Subject, FinalReport, LinguisticAnalysis, Contradiction, Motive, Evidence } from '../types';
import { generate, parseLLMJson } from './localLLMService';

type UpdateProgressCallback = (stepName: string, status: 'running' | 'completed' | 'error', details?: any) => void;

// FR-003.2a: Linguistic Analysis
async function executeLinguisticAnalysis(statement: string): Promise<LinguisticAnalysis> {
    const prompt = `You are acting as a specialized local model. Your task is to perform a linguistic analysis on the provided text. Analyze it for euphemisms, framing, and overall plausibility.
Text: "${statement}"
Output ONLY a valid JSON object matching the specified schema.
Schema:
{
  "euphemisms": ["string"],
  "framing": "string",
  "plausibility": "string"
}`;

    const responseText = await generate(prompt, true);
    return parseLLMJson(responseText);
}

// FR-003.2b: Inconsistency Check
async function executeInconsistencyCheck(subject: Subject, statement: string): Promise<Contradiction[]> {
  const prompt = `You are acting as a reasoning agent. You are analyzing a new statement from '${subject.name}'. Your task is to find contradictions by comparing the new statement against their historical data from a local vector database.
  
New Statement: "${statement}"

Historical Data for ${subject.name} (from local database):
\`\`\`json
${JSON.stringify(subject.ingestedData.slice(0, 10), null, 2)}
\`\`\`

Find up to 2 direct contradictions. For each, explain why it's a contradiction and cite the source document. If no contradictions are found, return an empty array.
Output ONLY a valid JSON object matching the specified schema (an array of contradictions).`;

  const responseText = await generate(prompt, true);
  return parseLLMJson(responseText) || [];
}

// FR-003.2c: Motive & Financial Analysis
async function executeMotiveCheck(subject: Subject, statement: string): Promise<Motive[]> {
  const prompt = `You are acting as a reasoning agent. You are analyzing a new statement from '${subject.name}'. Your task is to identify potential financial motives or conflicts of interest by checking their historical data, especially donations and financially-related articles.

New Statement: "${statement}"

Historical Data for ${subject.name} (from local database, filtered for donations/finance):
\`\`\`json
${JSON.stringify(subject.ingestedData.filter(d => d.type === 'donation' || d.type === 'article').slice(0, 10), null, 2)}
\`\`\`

Find up to 2 potential motives or conflicts. For each, explain the connection and cite the source. If none are found, return an empty array.
Output ONLY a valid JSON object matching the specified schema (an array of motives).`;

  const responseText = await generate(prompt, true);
  return parseLLMJson(responseText) || [];
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
Write a comprehensive, objective report in Markdown format based ONLY on the provided information. Structure it with headings: ## Summary, ## Detailed Findings, and ## Potential Agenda.`;
  
  const responseText = await generate(prompt, false);
  return responseText;
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
        throw new Error(`Error during local analysis: ${error.message}`);
    }
    throw new Error('An unknown error occurred during local analysis.');
  }
};

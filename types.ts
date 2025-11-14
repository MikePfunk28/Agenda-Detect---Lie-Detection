
export enum AnalysisStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
}

export type ProgressStepStatus = 'pending' | 'running' | 'completed' | 'error';

export interface ProgressStep {
  name: string;
  status: ProgressStepStatus;
  details?: any;
}

export interface AnalysisPlan {
  steps: {
    tool: 'linguistic_analysis' | 'web_search' | 'local_vector_search';
    query: string;
  }[];
}

export interface LinguisticAnalysis {
  euphemisms: string[];
  framing: string;
  emotional_language: string[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface VectorSearchResult {
  source: string;
  content: string;
}

export interface Evidence {
  linguisticAnalysis: LinguisticAnalysis | null;
  webSearches: WebSearchResult[];
  vectorSearches: VectorSearchResult[];
}

export interface FinalReport {
  originalStatement: string;
  markdownReport: string;
  evidence: Evidence;
}

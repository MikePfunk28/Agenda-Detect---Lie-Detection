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

export interface LLMSettings {
  endpoint: string;
  model: string;
}

// FR-002.5: Metadata (Strict Schema)
export type DocumentType = 'vote' | 'donation' | 'speech' | 'article' | 'leak' | 'tweet' | 'other';
export interface IngestedDocument {
    id: string;
    subject: string;
    type: DocumentType;
    source: string; // filename or URL
    date: string; // YYYY-MM-DD
    content: string; // The text content
    status: 'pending' | 'processing' | 'indexed' | 'error';
}

// Represents a single analysis report
export interface FinalReport {
  id: string;
  originalStatement: string;
  markdownReport: string;
  evidence: Evidence;
  progress: ProgressStep[];
  timestamp: string;
}

// The central data structure for a political subject
export interface Subject {
  id: string;
  name: string;
  ingestedData: IngestedDocument[];
  reports: FinalReport[];
}


// --- Analysis-specific types ---

export interface LinguisticAnalysis {
  euphemisms: string[];
  framing: string;
  plausibility: string;
}

export interface Contradiction {
    sourceDocument: {
        id: string;
        source: string;
        date: string;
    };
    contradictoryStatement: string;
    explanation: string;
}

export interface Motive {
    sourceDocument: {
        id: string;
        source: string;
        date: string;
        type: 'donation' | 'article';
    };
    potentialMotive: string;
    explanation: string;
}

export interface Evidence {
  linguisticAnalysis: LinguisticAnalysis | null;
  inconsistencyChecks: Contradiction[];
  motiveChecks: Motive[];
}

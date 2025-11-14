
import React, { useState, useCallback } from 'react';
import { runAnalysis } from './services/geminiService';
import type { FinalReport, ProgressStep } from './types';
import { AnalysisStatus } from './types';
import StatementInput from './components/StatementInput';
import AnalysisProgress from './components/AnalysisProgress';
import ReportDisplay from './components/ReportDisplay';
import { BrainIcon, CpuChipIcon } from './components/icons';

const initialProgress: ProgressStep[] = [
  { name: 'Intake & Planning', status: 'pending' },
  { name: 'Linguistic Analysis', status: 'pending' },
  { name: 'Web Search', status: 'pending' },
  { name: 'Local Vector Search', status: 'pending' },
  { name: 'Synthesis & Reporting', status: 'pending' },
];

const App: React.FC = () => {
  const [statement, setStatement] = useState<string>('');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [progress, setProgress] = useState<ProgressStep[]>(initialProgress);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async () => {
    if (!statement.trim()) {
      setError('Please enter a statement to analyze.');
      return;
    }
    setAnalysisStatus(AnalysisStatus.RUNNING);
    setError(null);
    setFinalReport(null);
    setProgress(initialProgress.map(p => ({ ...p, status: 'pending' })));

    const updateProgress = (stepName: string, status: 'running' | 'completed' | 'error', details?: any) => {
      setProgress(prev =>
        prev.map(step =>
          step.name === stepName ? { ...step, status, details } : step
        )
      );
    };

    try {
      const report = await runAnalysis(statement, updateProgress);
      setFinalReport(report);
      setAnalysisStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setAnalysisStatus(AnalysisStatus.ERROR);
      setProgress(prev => prev.map(step => step.status === 'running' ? {...step, status: 'error'} : step));
    }
  }, [statement]);
  
  const resetState = () => {
    setStatement('');
    setAnalysisStatus(AnalysisStatus.IDLE);
    setProgress(initialProgress);
    setFinalReport(null);
    setError(null);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            Agenda Detector
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            AI-Powered Analysis of Political Statements
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
             <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg flex-1">
                    <BrainIcon className="h-8 w-8 text-cyan-400 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-white">Reasoning Agent (The "Brain")</h3>
                        <p className="text-sm text-gray-400">Simulated Qwen3:4B-Thinking for planning, reasoning, and synthesis.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg flex-1">
                    <CpuChipIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-white">Structured Output Agent (The "Parser")</h3>
                        <p className="text-sm text-gray-400">Simulated Qwen3:1.7B for structured data extraction like linguistic analysis.</p>
                    </div>
                </div>
            </div>

            {analysisStatus === AnalysisStatus.IDLE || analysisStatus === AnalysisStatus.ERROR ? (
               <StatementInput
                statement={statement}
                setStatement={setStatement}
                onAnalyze={handleAnalysis}
                isLoading={analysisStatus === AnalysisStatus.RUNNING}
              />
            ) : null}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
              <p><span className="font-bold">Analysis Failed:</span> {error}</p>
            </div>
          )}

          {analysisStatus !== AnalysisStatus.IDLE && (
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold mb-4 text-white">Analysis Workflow</h2>
              <AnalysisProgress steps={progress} />
            </div>
          )}

          {analysisStatus === AnalysisStatus.SUCCESS && finalReport && (
             <ReportDisplay report={finalReport} onReset={resetState} />
          )}

          {analysisStatus === AnalysisStatus.RUNNING && (
             <div className="flex justify-center items-center p-8 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-lg text-gray-300">Analysis in progress, please wait...</p>
                </div>
             </div>
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Gemini API. This is a frontend simulation of the provided design document.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useCallback, useEffect } from 'react';
import type { Subject, FinalReport, IngestedDocument, LLMSettings } from './types';
import { AnalysisStatus } from './types';
import SubjectPanel from './components/SubjectPanel';
import SubjectProfile from './components/SubjectProfile';
import SettingsModal from './components/SettingsModal';
import { BrainIcon, Cog6ToothIcon } from './components/icons';
import { runAnalysis } from './services/localAnalysisService';
import { configure as configureLLMService } from './services/localLLMService';


const App: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 'subj-01', name: 'Politician X', ingestedData: [], reports: [] }
  ]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>('subj-01');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [llmSettings, setLlmSettings] = useState<LLMSettings>({
    endpoint: 'http://localhost:11434/api/generate',
    model: 'llama3'
  });

  useEffect(() => {
    configureLLMService(llmSettings);
  }, [llmSettings]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || null;

  const handleAddSubject = (name: string) => {
    if (name && !subjects.some(s => s.name === name)) {
      const newSubject: Subject = {
        id: `subj-${Date.now()}`,
        name,
        ingestedData: [],
        reports: [],
      };
      setSubjects(prev => [...prev, newSubject]);
      setSelectedSubjectId(newSubject.id);
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    const remainingSubjects = subjects.filter(s => s.id !== subjectId);
    setSubjects(remainingSubjects);
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(remainingSubjects.length > 0 ? remainingSubjects[0].id : null);
    }
  };
  
  const handleAddIngestedData = (subjectId: string, documents: IngestedDocument[]) => {
      setSubjects(subjects => subjects.map(s => {
          if (s.id === subjectId) {
              return { ...s, ingestedData: [...s.ingestedData, ...documents] };
          }
          return s;
      }));
  };
  
  const handleSaveSettings = (newSettings: LLMSettings) => {
    setLlmSettings(newSettings);
    setIsSettingsOpen(false);
    alert('Settings saved. The app will now use the new configuration.');
  };

  const handleRunAnalysis = useCallback(async (subject: Subject, statement: string) => {
    setAnalysisStatus(AnalysisStatus.RUNNING);
    setError(null);

    const updateProgressOnSubject = (reportId: string, stepName: string, status: 'running' | 'completed' | 'error', details?: any) => {
        setSubjects(prev => prev.map(s => {
            if (s.id === subject.id) {
                const report = s.reports.find(r => r.id === reportId);
                if (report) {
                    const updatedSteps = report.progress.map(p => p.name === stepName ? { ...p, status, details } : p);
                    const updatedReport = { ...report, progress: updatedSteps };
                    return { ...s, reports: s.reports.map(r => r.id === reportId ? updatedReport : r) };
                }
            }
            return s;
        }));
    };

    const reportId = `report-${Date.now()}`;
    const initialReport: FinalReport = {
        id: reportId,
        originalStatement: statement,
        markdownReport: '',
        evidence: { linguisticAnalysis: null, inconsistencyChecks: [], motiveChecks: [] },
        progress: [
            { name: 'Linguistic Analysis', status: 'pending' },
            { name: 'Inconsistency Check', status: 'pending' },
            { name: 'Motive & Financial Analysis', status: 'pending' },
            { name: 'Synthesis & Reporting', status: 'pending' },
        ],
        timestamp: new Date().toISOString(),
    };
    
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, reports: [initialReport, ...s.reports] } : s));
    
    try {
      const completedReportData = await runAnalysis(subject, statement, (step, status, details) => updateProgressOnSubject(reportId, step, status, details));
      
      setSubjects(prev => prev.map(s => {
          if (s.id === subject.id) {
              const finalReport: FinalReport = { ...initialReport, ...completedReportData, progress: initialReport.progress.map(p => ({...p, status: 'completed'})) };
              return { ...s, reports: s.reports.map(r => r.id === reportId ? finalReport : r) };
          }
          return s;
      }));
      setAnalysisStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setAnalysisStatus(AnalysisStatus.ERROR);
       updateProgressOnSubject(reportId, 'Synthesis & Reporting', 'error');
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
      <SubjectPanel
        subjects={subjects}
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={setSelectedSubjectId}
        onAddSubject={handleAddSubject}
        onDeleteSubject={handleDeleteSubject}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-800/50 border-b border-gray-700 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <BrainIcon className="h-8 w-8 text-cyan-400" />
                <div>
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        Agenda Detector
                    </h1>
                    <p className="text-sm text-gray-400">Local-First Analysis Engine</p>
                </div>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Open settings"
            >
              <Cog6ToothIcon className="h-6 w-6 text-gray-400" />
            </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {selectedSubject ? (
                <SubjectProfile 
                    key={selectedSubject.id} 
                    subject={selectedSubject}
                    onRunAnalysis={(statement) => handleRunAnalysis(selectedSubject, statement)}
                    onAddData={(docs) => handleAddIngestedData(selectedSubject.id, docs)}
                    analysisStatus={analysisStatus}
                    error={error}
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-400">No Subject Selected</h2>
                        <p className="mt-2 text-gray-500">Please select a subject from the left panel or add a new one to begin.</p>
                    </div>
                </div>
            )}
        </div>
      </main>
      {isSettingsOpen && (
        <SettingsModal
            currentSettings={llmSettings}
            onSave={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;

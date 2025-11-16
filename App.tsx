import React, { useState, useCallback } from 'react';
import type { Subject, FinalReport, IngestedDocument } from './types';
import { AnalysisStatus } from './types';
import SubjectPanel from './components/SubjectPanel';
import SubjectProfile from './components/SubjectProfile';
import { BrainIcon } from './components/icons';
import { runAnalysis } from './services/localAnalysisService';

const App: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: 'subj-01', name: 'Politician X', ingestedData: [], reports: [] }
  ]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>('subj-01');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

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
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
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

  const handleRunAnalysis = useCallback(async (subject: Subject, statement: string) => {
    setAnalysisStatus(AnalysisStatus.RUNNING);
    setError(null);

    // This function will be passed to the analysis service to update progress
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

    // Create a preliminary report object to track progress
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
    
    // Add the report-in-progress to the subject
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, reports: [initialReport, ...s.reports] } : s));
    
    try {
      const completedReportData = await runAnalysis(subject, statement, (step, status, details) => updateProgressOnSubject(reportId, step, status, details));
      
      // Update the final report in the state
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
      // Mark the last running step as error
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
        <header className="bg-gray-800/50 border-b border-gray-700 p-4 flex items-center gap-4">
            <BrainIcon className="h-8 w-8 text-cyan-400" />
            <div>
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    Agenda Detector
                </h1>
                <p className="text-sm text-gray-400">Local-First Analysis Engine</p>
            </div>
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
    </div>
  );
};

export default App;
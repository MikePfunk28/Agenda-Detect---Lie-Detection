import React, { useState } from 'react';
// FIX: Changed import of 'AnalysisStatus' from a type-only import to a value import,
// as it is used for a value comparison below.
import { AnalysisStatus } from '../types';
import type { Subject, IngestedDocument, FinalReport } from '../types';
import StatementInput from './StatementInput';
import AnalysisProgress from './AnalysisProgress';
import ReportDisplay from './ReportDisplay';
import DataIngestion from './DataIngestion';
import { DocumentDuplicateIcon, FolderArrowDownIcon } from './icons';

interface SubjectProfileProps {
  subject: Subject;
  onRunAnalysis: (statement: string) => void;
  onAddData: (documents: IngestedDocument[]) => void;
  analysisStatus: AnalysisStatus;
  error: string | null;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      active
        ? 'border-cyan-500 text-cyan-400'
        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
    }`}
  >
    {children}
  </button>
);

const SubjectProfile: React.FC<SubjectProfileProps> = ({ subject, onRunAnalysis, onAddData, analysisStatus, error }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
      subject.reports.length > 0 ? subject.reports[0].id : null
  );

  const selectedReport = subject.reports.find(r => r.id === selectedReportId) || null;
  const latestReport = subject.reports.length > 0 ? subject.reports[0] : null;
  const isRunningAnalysis = analysisStatus === AnalysisStatus.RUNNING;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{subject.name} - Profile</h1>
      
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex gap-4" aria-label="Tabs">
          <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
            <DocumentDuplicateIcon className="h-5 w-5" /> Analysis
          </TabButton>
          <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')}>
            <FolderArrowDownIcon className="h-5 w-5" /> Ingested Data
          </TabButton>
        </nav>
      </div>

      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <StatementInput onAnalyze={onRunAnalysis} analysisStatus={analysisStatus} />
                </div>
                 <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="font-bold mb-2 text-white">Analysis History</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {subject.reports.map(report => (
                            <div 
                                key={report.id} 
                                onClick={() => setSelectedReportId(report.id)}
                                className={`p-2 rounded-md cursor-pointer ${selectedReportId === report.id ? 'bg-cyan-600/20' : 'hover:bg-gray-700/50'}`}
                            >
                                <p className="text-sm truncate text-gray-200" title={report.originalStatement}>"{report.originalStatement}"</p>
                                <p className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</p>
                            </div>
                        ))}
                        {subject.reports.length === 0 && <p className="text-sm text-gray-500">No reports yet.</p>}
                    </div>
                 </div>
            </div>
            <div className="lg:col-span-2">
                {error && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-4">
                    <p><span className="font-bold">Analysis Failed:</span> {error}</p>
                  </div>
                )}
                {isRunningAnalysis && latestReport && (
                    <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4 text-white">Analysis Workflow</h2>
                        <AnalysisProgress steps={latestReport.progress} />
                    </div>
                )}
                {!isRunningAnalysis && selectedReport && <ReportDisplay report={selectedReport} />}
                {!isRunningAnalysis && !selectedReport && (
                    <div className="flex items-center justify-center h-full bg-gray-800/50 rounded-lg border border-gray-700 p-8">
                        <p className="text-gray-400">Select a report from the history to view details.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {activeTab === 'data' && <DataIngestion subject={subject} onAddData={onAddData} />}
    </div>
  );
};

export default SubjectProfile;
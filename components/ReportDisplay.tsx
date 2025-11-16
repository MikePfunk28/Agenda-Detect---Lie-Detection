import React, { useState } from 'react';
import type { FinalReport, Contradiction, Motive } from '../types';
import { DocumentTextIcon, CodeBracketIcon, ExclamationTriangleIcon, BanknotesIcon } from './icons';

interface ReportDisplayProps {
  report: FinalReport;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-cyan-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const MarkdownReport: React.FC<{ content: string }> = ({ content }) => {
  if (!content) {
      return <p className="text-gray-400 italic">Report synthesis is not yet complete.</p>;
  }
  const formattedContent = content
    .split('\n')
    .map(line => {
        if (line.startsWith('### ')) return `<h3 class="text-xl font-bold mt-4 mb-2 text-cyan-300">${line.substring(4)}</h3>`;
        if (line.startsWith('## ')) return `<h2 class="text-2xl font-bold mt-6 mb-3 border-b border-gray-600 pb-2 text-cyan-400">${line.substring(3)}</h2>`;
        if (line.startsWith('# ')) return `<h1 class="text-3xl font-bold mt-8 mb-4 text-cyan-500">${line.substring(2)}</h1>`;
        if (line.startsWith('* ')) return `<li class="ml-5 list-disc">${line.substring(2)}</li>`;
        if (line.trim() === '') return '<br />';
        return `<p class="text-gray-300 leading-relaxed">${line}</p>`;
    })
    .join('');

  return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formattedContent }} />;
};

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState('report');

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 mb-6">
            <p className="text-gray-400">Analysis of Statement:</p>
            <blockquote className="italic text-gray-200 mt-1">"{report.originalStatement}"</blockquote>
        </div>

        <div className="border-b border-gray-700 mb-6">
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
            <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')}>
              <DocumentTextIcon className="h-5 w-5" /> Synthesis Report
            </TabButton>
            <TabButton active={activeTab === 'linguistic'} onClick={() => setActiveTab('linguistic')}>
                <CodeBracketIcon className="h-5 w-5" /> Linguistic
            </TabButton>
            <TabButton active={activeTab === 'inconsistencies'} onClick={() => setActiveTab('inconsistencies')}>
              <ExclamationTriangleIcon className="h-5 w-5" /> Inconsistencies
            </TabButton>
            <TabButton active={activeTab === 'motives'} onClick={() => setActiveTab('motives')}>
              <BanknotesIcon className="h-5 w-5" /> Motives
            </TabButton>
          </nav>
        </div>

        <div>
          {activeTab === 'report' && <MarkdownReport content={report.markdownReport} />}
          {activeTab === 'linguistic' && (
             <div>
                <h3 className="text-lg font-bold mb-2 text-gray-200">Linguistic Analysis Results</h3>
                {report.evidence.linguisticAnalysis ? (
                    <pre className="bg-gray-900/70 p-4 rounded-md text-sm text-cyan-200 overflow-x-auto">
                        {JSON.stringify(report.evidence.linguisticAnalysis, null, 2)}
                    </pre>
                ) : (
                    <p className="text-gray-400 italic">No linguistic analysis data available.</p>
                )}
             </div>
          )}
          {activeTab === 'inconsistencies' && (
            <div className="space-y-4">
               <h3 className="text-lg font-bold mb-2 text-gray-200">Inconsistency Check Results</h3>
              {report.evidence.inconsistencyChecks.length > 0 ? report.evidence.inconsistencyChecks.map((item: Contradiction, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-red-400 font-semibold">Potential Contradiction Found</p>
                  <p className="mt-2 text-gray-300"><span className='font-bold'>Explanation:</span> {item.explanation}</p>
                  <div className="mt-3 border-t border-gray-600 pt-3">
                      <p className="text-sm text-gray-400">Source: <span className='font-mono'>{item.sourceDocument.source} ({item.sourceDocument.date})</span></p>
                      <blockquote className="mt-1 pl-2 border-l-2 border-gray-500 text-gray-300 italic">"{item.contradictoryStatement}"</blockquote>
                  </div>
                </div>
              )) : <p className="text-gray-400 italic">No inconsistencies were found based on the available data.</p>}
            </div>
          )}
          {activeTab === 'motives' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold mb-2 text-gray-200">Motive & Financial Analysis Results</h3>
              {report.evidence.motiveChecks.length > 0 ? report.evidence.motiveChecks.map((item: Motive, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-yellow-400 font-semibold">Potential Motive/Conflict of Interest Found</p>
                   <p className="mt-2 text-gray-300"><span className='font-bold'>Explanation:</span> {item.explanation}</p>
                   <div className="mt-3 border-t border-gray-600 pt-3">
                      <p className="text-sm text-gray-400">Source: <span className='font-mono'>{item.sourceDocument.source} ({item.sourceDocument.date})</span></p>
                      <p className="text-sm text-gray-400">Type: <span className='font-mono capitalize'>{item.sourceDocument.type}</span></p>
                      <blockquote className="mt-1 pl-2 border-l-2 border-gray-500 text-gray-300 italic">"{item.potentialMotive}"</blockquote>
                  </div>
                </div>
              )) : <p className="text-gray-400 italic">No clear financial motives or conflicts of interest were found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;

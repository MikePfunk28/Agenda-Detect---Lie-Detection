
import React, { useState } from 'react';
import type { FinalReport, WebSearchResult, VectorSearchResult } from '../types';
import { DocumentTextIcon, GlobeAltIcon, CircleStackIcon, CodeBracketIcon, ArrowUturnLeftIcon } from './icons';

interface ReportDisplayProps {
  report: FinalReport;
  onReset: () => void;
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

const ReportDisplay: React.FC<ReportDisplayProps> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState('report');

  return (
    <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Analysis Complete</h2>
          <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-colors"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" />
              New Analysis
            </button>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 mb-6">
            <p className="text-gray-400">Original Statement:</p>
            <blockquote className="italic text-gray-200 mt-1">"{report.originalStatement}"</blockquote>
        </div>

        <div className="border-b border-gray-700 mb-6">
          <nav className="flex flex-wrap gap-2" aria-label="Tabs">
            <TabButton active={activeTab === 'report'} onClick={() => setActiveTab('report')}>
              <DocumentTextIcon className="h-5 w-5" /> Synthesis Report
            </TabButton>
            <TabButton active={activeTab === 'linguistic'} onClick={() => setActiveTab('linguistic')}>
                <CodeBracketIcon className="h-5 w-5" /> Linguistic Analysis
            </TabButton>
            <TabButton active={activeTab === 'web'} onClick={() => setActiveTab('web')}>
              <GlobeAltIcon className="h-5 w-5" /> Web Evidence
            </TabButton>
            <TabButton active={activeTab === 'vector'} onClick={() => setActiveTab('vector')}>
              <CircleStackIcon className="h-5 w-5" /> Document Evidence
            </TabButton>
          </nav>
        </div>

        <div>
          {activeTab === 'report' && <MarkdownReport content={report.markdownReport} />}
          {activeTab === 'linguistic' && (
             <div>
                <pre className="bg-gray-900/70 p-4 rounded-md text-sm text-cyan-200 overflow-x-auto">
                    {JSON.stringify(report.evidence.linguisticAnalysis, null, 2)}
                </pre>
             </div>
          )}
          {activeTab === 'web' && (
            <div className="space-y-4">
              {report.evidence.webSearches.map((item: WebSearchResult, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-lg font-semibold text-blue-400 hover:underline">{item.title}</a>
                  <p className="text-sm text-green-400">{item.url}</p>
                  <p className="mt-2 text-gray-300">{item.snippet}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'vector' && (
            <div className="space-y-4">
              {report.evidence.vectorSearches.map((item: VectorSearchResult, index) => (
                <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <p className="text-sm font-medium text-gray-400 mb-1">{item.source}</p>
                  <p className="text-gray-300">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDisplay;

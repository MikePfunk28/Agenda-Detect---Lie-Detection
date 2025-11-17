import React, { useState, useCallback } from 'react';
import type { Subject, IngestedDocument } from '../types';
import { FolderArrowDownIcon } from './icons';
import { runAutomatedSearch } from '../services/localLLMService';

interface DataIngestionProps {
  subject: Subject;
  onAddData: (documents: IngestedDocument[]) => void;
}

const DataIngestion: React.FC<DataIngestionProps> = ({ subject, onAddData }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    const newDocs: IngestedDocument[] = [];
    // FIX: Add a type guard to ensure 'file' is a File object. This resolves
    // TypeScript errors about properties like '.name' not existing on type 'unknown'
    // and makes the error handling in the catch block type-safe.
    for (const file of Array.from(files)) {
        if (file instanceof File) {
            let content = `(Content of binary file '${file.name}' not readable in browser)`;
            if (file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
                try {
                    content = await readFileAsText(file);
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                    content = `(Error reading file: ${errorMessage})`;
                }
            }
            newDocs.push({
                id: `doc-${Date.now()}-${Math.random()}`,
                subject: subject.name,
                type: 'other',
                source: file.name,
                date: new Date().toISOString().split('T')[0],
                content,
                status: 'indexed',
            });
        }
    }

    if (newDocs.length > 0) {
        onAddData(newDocs);
        alert(`${newDocs.length} file(s) processed for ingestion.`);
    }
  }, [subject.name, onAddData]);

  const handleAutomatedSearch = async () => {
    setIsSearching(true);
    try {
        const newDocs = await runAutomatedSearch(subject.name);
        if (newDocs && newDocs.length > 0) {
            onAddData(newDocs);
            alert(`${newDocs.length} new documents found and ingested by the local agent.`);
        } else {
            alert(`The local agent found no new documents for "${subject.name}".`);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Automated search failed:", error);
        alert(`Automated search failed. Make sure your local LLM server is running and configured correctly in Settings.\n\nError: ${errorMessage}`);
    } finally {
        setIsSearching(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Ingestion */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-white">Manual Ingestion</h3>
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors ${
              isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-gray-600 hover:border-cyan-600'
            }`}
          >
            <FolderArrowDownIcon className="h-12 w-12 text-gray-500 mb-2" />
            <p className="text-gray-400">Drag & drop files here</p>
            <p className="text-sm text-gray-500">.txt, .md, .json, etc.</p>
          </div>
        </div>

        {/* Automated Ingestion */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-white">Automated Ingestion</h3>
          <p className="text-gray-400 mb-4">
            Trigger the local agent to search for new public records, articles, voting records, and donor reports.
          </p>
          <button
            onClick={handleAutomatedSearch}
            disabled={isSearching}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
             {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Run Automated Search'
              )}
          </button>
        </div>
      </div>

      {/* Ingested Data Table */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-4 text-white">Indexed Document Store</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {subject.ingestedData.map(doc => (
                        <tr key={doc.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300 truncate max-w-xs" title={doc.source}>{doc.source}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 capitalize">{doc.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{doc.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doc.status === 'indexed' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
                                    {doc.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                     {subject.ingestedData.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No documents have been ingested for this subject yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DataIngestion;

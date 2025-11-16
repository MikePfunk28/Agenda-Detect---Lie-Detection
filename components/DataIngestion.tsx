import React, { useState, useCallback } from 'react';
import type { Subject, IngestedDocument, DocumentType } from '../types';
import { FolderArrowDownIcon } from './icons';

interface DataIngestionProps {
  subject: Subject;
  onAddData: (documents: IngestedDocument[]) => void;
}

const DataIngestion: React.FC<DataIngestionProps> = ({ subject, onAddData }) => {
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // FIX: Explicitly type `file` as `File` to fix type inference issue where it was treated as `unknown`.
      const newDocs: IngestedDocument[] = Array.from(files).map((file: File) => ({
        id: `doc-${Date.now()}-${Math.random()}`,
        subject: subject.name,
        type: 'other', // In a real app, we'd detect this
        source: file.name,
        date: new Date().toISOString().split('T')[0],
        content: `(Simulated content of ${file.name})`,
        status: 'indexed', // Simulate immediate indexing for UI
      }));
      onAddData(newDocs);
      alert(`${files.length} file(s) added for ingestion. This is a simulation.`);
    }
  }, [subject.name, onAddData]);

  const handleAutomatedSearch = () => {
    // This is a mock for the UI. In a real app, this would trigger the backend.
    alert(`Simulating automated search for "${subject.name}". This would trigger the backend Qwen3:4B agent to search public records.`);
    const newDocs: IngestedDocument[] = [
        {
            id: `doc-${Date.now()}`,
            subject: subject.name,
            type: 'article',
            source: 'https://simulated-news.com/article-123',
            date: new Date().toISOString().split('T')[0],
            content: `A new simulated article about ${subject.name} was found and indexed.`,
            status: 'indexed'
        }
    ];
    onAddData(newDocs);
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
            <p className="text-sm text-gray-500">.pdf, .txt, .mp3, .mp4, etc.</p>
          </div>
        </div>

        {/* Automated Ingestion */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-white">Automated Ingestion</h3>
          <p className="text-gray-400 mb-4">
            Trigger the backend agent to search for new public records, articles, voting records, and donor reports for this subject.
          </p>
          <button
            onClick={handleAutomatedSearch}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
          >
            Run Automated Search
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-300" title={doc.source}>{doc.source}</td>
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

import React from 'react';
import { SearchIcon } from './icons';

interface StatementInputProps {
  statement: string;
  setStatement: (value: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const StatementInput: React.FC<StatementInputProps> = ({ statement, setStatement, onAnalyze, isLoading }) => {
  return (
    <div>
      <label htmlFor="statement" className="block text-lg font-medium text-gray-300 mb-2">
        Enter a statement to analyze
      </label>
      <div className="relative">
        <textarea
          id="statement"
          rows={4}
          className="w-full bg-gray-900/70 border border-gray-600 rounded-lg p-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500 resize-none"
          placeholder="e.g., 'We are committed to a future of clean energy that benefits all our citizens...'"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={isLoading || !statement.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <SearchIcon className="h-5 w-5" />
              Analyze Statement
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StatementInput;

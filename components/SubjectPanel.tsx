import React, { useState } from 'react';
import type { Subject } from '../types';
import { UserPlusIcon, TrashIcon } from './icons';

interface SubjectPanelProps {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (id: string) => void;
  onAddSubject: (name: string) => void;
  onDeleteSubject: (id: string) => void;
}

const SubjectPanel: React.FC<SubjectPanelProps> = ({ subjects, selectedSubjectId, onSelectSubject, onAddSubject, onDeleteSubject }) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddClick = () => {
    setShowInput(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewSubjectName(e.target.value);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onAddSubject(newSubjectName.trim());
      setNewSubjectName('');
      setShowInput(false);
    } else if (e.key === 'Escape') {
      setNewSubjectName('');
      setShowInput(false);
    }
  };

  return (
    <aside className="w-64 bg-gray-900/50 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Subjects</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {subjects.map(subject => (
          <div
            key={subject.id}
            onClick={() => onSelectSubject(subject.id)}
            className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
              selectedSubjectId === subject.id
                ? 'bg-cyan-600/20 text-cyan-300'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
          >
            <span className="truncate">{subject.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete ${subject.name}? This action cannot be undone.`)) {
                    onDeleteSubject(subject.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        {showInput ? (
          <input
            type="text"
            value={newSubjectName}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={() => setShowInput(false)}
            placeholder="Enter name and press Enter"
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-cyan-500 focus:border-cyan-500"
            autoFocus
          />
        ) : (
          <button
            onClick={handleAddClick}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add New Subject
          </button>
        )}
      </div>
    </aside>
  );
};

export default SubjectPanel;
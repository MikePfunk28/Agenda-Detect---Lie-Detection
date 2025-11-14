
import React from 'react';
import type { ProgressStep } from '../types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ArrowPathIcon } from './icons';

interface AnalysisProgressProps {
  steps: ProgressStep[];
}

const getStatusIcon = (status: ProgressStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
    case 'running':
      return <ArrowPathIcon className="h-6 w-6 text-cyan-400 animate-spin" />;
    case 'error':
      return <XCircleIcon className="h-6 w-6 text-red-400" />;
    case 'pending':
    default:
      return <ClockIcon className="h-6 w-6 text-gray-500" />;
  }
};

const getStatusColor = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed': return 'text-green-300';
      case 'running': return 'text-cyan-300';
      case 'error': return 'text-red-300';
      case 'pending':
      default: return 'text-gray-400';
    }
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {steps.map((step, stepIdx) => (
          <li key={step.name}>
            <div className="relative pb-8">
              {stepIdx !== steps.length - 1 ? (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-700" aria-hidden="true" />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center ring-8 ring-gray-800/50">
                  {getStatusIcon(step.status)}
                </div>
                <div className="min-w-0 flex-1 pt-1.5">
                  <p className={`text-lg font-medium ${getStatusColor(step.status)}`}>
                    {step.name}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{step.status}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AnalysisProgress;

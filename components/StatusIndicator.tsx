
import React from 'react';
import { AppStatus } from '../types';

interface StatusIndicatorProps {
  status: AppStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const getStatusInfo = () => {
    switch (status) {
      case AppStatus.IDLE:
        return { text: 'Ready to Connect', color: 'bg-gray-500' };
      case AppStatus.CONNECTING:
        return { text: 'Connecting...', color: 'bg-yellow-500 animate-pulse' };
      case AppStatus.LISTENING:
        return { text: 'Listening...', color: 'bg-green-500 animate-pulse' };
      case AppStatus.ERROR:
        return { text: 'Connection Error', color: 'bg-red-500' };
      default:
        return { text: 'Idle', color: 'bg-gray-500' };
    }
  };

  const { text, color } = getStatusInfo();

  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <span className="text-slate-300 font-medium">{text}</span>
    </div>
  );
};

export default StatusIndicator;

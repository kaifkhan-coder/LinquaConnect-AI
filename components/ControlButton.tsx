
import React from 'react';
import { AppStatus } from '../types';

interface ControlButtonProps {
  status: AppStatus;
  onClick: () => void;
}

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85l-.82 4.1C15.45 18.99 13.84 20 12 20s-3.45-1.01-4.11-3.05l-.82-4.1c-.08-.49-.49-.85-.98-.85-.55 0-1 .45-1 1s.45 1 1 1c.07 0 .14.01.2.03l.82 4.1C9.93 19.55 10.9 20 12 20s2.07-.45 2.78-1.88l.82-4.1c.06-.02.13-.03.2-.03.55 0 1-.45 1-1s-.45-1-1-1z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h12v12H6z" />
    </svg>
);

const LoadingSpinner = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const ControlButton: React.FC<ControlButtonProps> = ({ status, onClick }) => {
  const isConnecting = status === AppStatus.CONNECTING;
  const isListening = status === AppStatus.LISTENING;

  const getButtonClass = () => {
    if (isListening) return 'bg-red-600 hover:bg-red-700';
    if (isConnecting) return 'bg-gray-500 cursor-not-allowed';
    return 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700';
  };
  
  const getIcon = () => {
    if (isConnecting) return <LoadingSpinner />;
    if (isListening) return <StopIcon />;
    return <MicrophoneIcon />;
  };

  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 transform hover:scale-105 ${getButtonClass()}`}
    >
      {getIcon()}
    </button>
  );
};

export default ControlButton;

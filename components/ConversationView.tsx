
import React, { useRef, useEffect } from 'react';
import { TranscriptMessage } from '../types';

interface ConversationViewProps {
  messages: TranscriptMessage[];
}

const ConversationView: React.FC<ConversationViewProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-full h-full bg-slate-800/50 rounded-lg p-4 overflow-y-auto flex flex-col space-y-4">
      {messages.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-slate-400">Your conversation will appear here...</p>
        </div>
      ) : (
        messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${
              msg.speaker === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.speaker === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                AI
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${
                msg.speaker === 'user'
                  ? 'bg-indigo-600 rounded-br-none'
                  : 'bg-slate-700 rounded-bl-none'
              }`}
            >
              <p className="text-white">{msg.text}</p>
            </div>
             {msg.speaker === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                You
              </div>
            )}
          </div>
        ))
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationView;

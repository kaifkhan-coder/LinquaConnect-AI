
import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed `LiveSession` from the import as it is not an exported member from '@google/genai'.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { AppStatus, LanguageOption, TranscriptMessage } from './types';
import { LANGUAGES } from './constants';
import { decode, decodeAudioData, createBlob } from './services/audioUtils';

import LanguageSelector from './components/LanguageSelector';
import ConversationView from './components/ConversationView';
import ControlButton from './components/ControlButton';
import StatusIndicator from './components/StatusIndicator';

// FIX: Added a local `LiveSession` interface to provide type safety for the session object, as this type is not exported from the library.
interface LiveSession {
  sendRealtimeInput(input: { media: Blob }): void;
  close(): void;
}

const App: React.FC = () => {
  const [appStatus, setAppStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<TranscriptMessage | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(LANGUAGES[0]);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopConversation = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close());
      sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    setAppStatus(AppStatus.IDLE);
    console.log('Conversation stopped and resources cleaned up.');
  }, []);

  const startConversation = useCallback(async () => {
    setAppStatus(AppStatus.CONNECTING);
    setTranscript([]);
    setStreamingMessage(null);

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: selectedLanguage.systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log('Connection opened.');
            if (streamRef.current && inputAudioContextRef.current) {
              mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
              };
              
              mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
              scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
              setAppStatus(AppStatus.LISTENING);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setStreamingMessage(prev => {
                if (prev?.speaker === 'user') {
                  return { speaker: 'user', text: prev.text + text };
                }
                return { speaker: 'user', text };
              });
            } else if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setStreamingMessage(prev => {
                if (prev?.speaker === 'user') {
                  setTranscript(t => [...t, prev]);
                  return { speaker: 'ai', text: text };
                }
                if (prev?.speaker === 'ai') {
                  return { speaker: 'ai', text: prev.text + text };
                }
                return { speaker: 'ai', text: text };
              });
            } else if (message.serverContent?.turnComplete) {
              setStreamingMessage(prev => {
                if (prev) {
                  setTranscript(t => [...t, prev]);
                }
                return null;
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const audioContext = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContext.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);

              source.onended = () => audioSourcesRef.current.delete(source);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Connection error:', e);
            setAppStatus(AppStatus.ERROR);
            stopConversation();
          },
          onclose: () => {
            console.log('Connection closed.');
            stopConversation();
          },
        },
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setAppStatus(AppStatus.ERROR);
      stopConversation();
    }
  }, [selectedLanguage, stopConversation]);

  const handleToggleConversation = () => {
    if (appStatus === AppStatus.LISTENING) {
      stopConversation();
    } else if (appStatus === AppStatus.IDLE || appStatus === AppStatus.ERROR) {
      startConversation();
    }
  };

  useEffect(() => {
    return () => {
        stopConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allMessages = streamingMessage ? [...transcript, streamingMessage] : transcript;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
        <header className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            LinguaConnect AI
          </h1>
          <p className="text-slate-400 mt-2">Your AI-powered language practice partner</p>
        </header>

        <div className="w-full h-[50vh] md:h-[60vh] bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 p-4 border border-slate-700/50 mb-6">
            <ConversationView messages={allMessages} />
        </div>

        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto">
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                disabled={appStatus !== AppStatus.IDLE && appStatus !== AppStatus.ERROR}
              />
            </div>
            <div className="flex-shrink-0">
              <ControlButton status={appStatus} onClick={handleToggleConversation} />
            </div>
            <div className="w-full md:w-auto">
              <StatusIndicator status={appStatus} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;

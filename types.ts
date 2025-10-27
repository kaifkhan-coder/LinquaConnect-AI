
export enum AppStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  ERROR = 'ERROR',
}

export interface LanguageOption {
  code: string;
  name: string;
  systemInstruction: string;
}

export interface TranscriptMessage {
  speaker: 'user' | 'ai';
  text: string;
}

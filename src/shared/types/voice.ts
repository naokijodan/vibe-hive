// Voice Command Types

export type VoiceCommandType =
  | 'task:create'
  | 'task:complete'
  | 'task:delete'
  | 'task:search'
  | 'task:assign'
  | 'view:switch'
  | 'session:switch'
  | 'unknown';

export interface VoiceCommand {
  type: VoiceCommandType;
  rawText: string;
  params: Record<string, string>;
  confidence: number;
  timestamp: number;
}

export interface VoiceCommandResult {
  success: boolean;
  command: VoiceCommand;
  message: string;
}

export interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  commandHistory: VoiceCommandResult[];
}

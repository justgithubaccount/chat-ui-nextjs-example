/**
 * Common types for voice functionality
 */

export interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isFinal: boolean;
  isInterrupted?: boolean;
}

export interface ConnectOptions {
  chatId?: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  temperature?: number;
  agentPreset?: 'default' | 'technical' | 'creative' | 'tutor';
}

export interface VoiceSessionConfig {
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
}

export const defaultVoiceConfig: VoiceSessionConfig = {
  model: 'gpt-realtime',
  voice: 'alloy',
  temperature: 0.8,
  maxTokens: 4096
};

export interface VoiceSessionContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  sessionId: string | null;

  // Audio state
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;

  // Session info
  sessionDuration: number;
  networkQuality?: string;
  voiceModel?: string;
  selectedVoice?: string;

  // Transcript
  transcript: TranscriptEntry[];

  // Actions
  connect: (options?: ConnectOptions) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  sendMessage: (message: string) => void;
  clearTranscript: () => void;
  changeVoice: (voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') => void;
  setAgentPreset: (preset: keyof typeof VoiceAgentInstructions) => void;
}

/**
 * Voice agent instruction presets
 */
export const VoiceAgentInstructions = {
  default: `You are a helpful and friendly AI assistant engaging in a voice conversation.
Key behaviors:
- Be conversational and natural in your responses
- Keep responses concise and clear for voice interaction
- Be proactive in asking clarifying questions when needed
- Use a warm and engaging tone
- Acknowledge when you hear the user to show you're listening
- Handle interruptions gracefully
- If asked to help with code, provide clear verbal explanations`,

  technical: `You are a technical assistant specializing in software development and programming.
Focus on:
- Providing clear technical explanations
- Offering code solutions and debugging help
- Explaining complex concepts in simple terms
- Being precise with technical terminology
- Suggesting best practices and patterns`,

  creative: `You are a creative assistant helping with brainstorming and ideation.
Focus on:
- Encouraging creative thinking
- Offering unique perspectives
- Building on ideas collaboratively
- Using imagination and "what if" scenarios
- Being enthusiastic and inspiring`,

  tutor: `You are a patient tutor helping users learn new concepts.
Focus on:
- Breaking down complex topics into simple steps
- Checking understanding frequently
- Providing examples and analogies
- Encouraging questions
- Adapting explanations to the user's level
- Celebrating progress and understanding`
} as const;
import { RealtimeAgent } from '@openai/agents/realtime';
import { VoiceAgentInstructions } from '@/types/voice';

/**
 * Create and configure the voice agent with instructions
 */
export function createVoiceAgent(instructions?: string) {
  const agent = new RealtimeAgent({
    name: 'Assistant',
    instructions: instructions || VoiceAgentInstructions.default,
    tools: [] // Add real tools as needed
  });

  return agent;
}

/**
 * Voice agent presets for different conversation styles
 */
export const VoiceAgentPresets = {
  default: createVoiceAgent(VoiceAgentInstructions.default),
  technical: createVoiceAgent(VoiceAgentInstructions.technical),
  creative: createVoiceAgent(VoiceAgentInstructions.creative),
  tutor: createVoiceAgent(VoiceAgentInstructions.tutor)
};

// Voice configuration types are now in @/types/voice
// Import them from there when needed
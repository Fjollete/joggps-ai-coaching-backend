// AI Coaching types that match Android app models
export interface CoachingRequest {
  deviceId: string;
  currentSegment: CurrentSegment;
  runTotals: RunTotals;
  intervalData?: IntervalData;
  trainingGoal?: TrainingGoal;
  model?: string;
}

export interface CurrentSegment {
  latitude: number;
  longitude: number;
  timestamp: number;
  heartRate?: number;
  speed: number;
  elevation?: number;
  accuracy: number;
  bearing?: number;
}

export interface RunTotals {
  distance: number; // meters
  duration: number; // milliseconds
  avgPace: number; // seconds per km
  avgHeartRate?: number;
}

export interface IntervalData {
  lastIntervalDistance: number; // meters
  lastIntervalTime: number; // milliseconds
  lastIntervalPace: number; // seconds per km
  recentPaces: number[]; // Last 3-5 interval paces for trend analysis
  pacePattern?: string; // "consistent", "speeding_up", "slowing_down"
}

export interface CoachingResponse {
  message: string;
  cacheKey?: string;
}

export interface UserProfile {
  deviceId: string;
  createdAt?: string;
  trainingGoal?: TrainingGoal;
  recentRuns: RunHistory[];
}

export interface TrainingGoal {
  raceType: string; // "half_marathon", "marathon", "10k", "5k"
  targetTime: number; // seconds
  raceDate: string; // ISO date
}

export interface RunHistory {
  date: string; // ISO date
  distance: number; // meters
  duration: number; // seconds
  avgPace: number; // seconds per km
}

// Cache settings - optimized for AI coaching variety
export interface CachedCoaching {
  message: string;
  timestamp: number;
  pace: number;
  heartRate?: number;
  distance: number;
  modelApiValue?: string;
}

// OpenRouter AI Model configuration
export interface AIModel {
  displayName: string;
  apiValue: string;
  maxTokens?: number;
}

export const AI_MODELS: Record<string, AIModel> = {
  'openai/gpt-4.1-nano': { displayName: 'GPT-4.1 Nano ($0.10)', apiValue: 'openai/gpt-4.1-nano', maxTokens: 150 },
  'openai/gpt-5-mini': { displayName: 'GPT-5 Mini ($0.25)', apiValue: 'openai/gpt-5-mini', maxTokens: 2500 },
  'openai/gpt-5-nano': { displayName: 'GPT-5 Nano ($0.05)', apiValue: 'openai/gpt-5-nano', maxTokens: 2500 },
  'openai/gpt-4o-mini': { displayName: 'GPT-4o Mini ($0.15)', apiValue: 'openai/gpt-4o-mini', maxTokens: 150 },
  'google/gemini-2.5-flash': { displayName: 'Gemini 2.5 Flash ($0.30)', apiValue: 'google/gemini-2.5-flash', maxTokens: 150 },
  'qwen/qwen3-235b-a22b-thinking-2507': { displayName: 'Qwen3 235B Thinking', apiValue: 'qwen/qwen3-235b-a22b-thinking-2507', maxTokens: 2500 },
  'meta-llama/llama-3.2-3b-instruct': { displayName: 'Llama 3.2 3B', apiValue: 'meta-llama/llama-3.2-3b-instruct', maxTokens: 150 },
  'anthropic/claude-3-haiku': { displayName: 'Claude 3 Haiku ($0.25)', apiValue: 'anthropic/claude-3-haiku', maxTokens: 150 },
  // Add more models as needed
};

export const isReasoningModel = (model: string): boolean => {
  return model.includes('gpt-5') || model.includes('o1') || model.includes('o4') || model.includes('thinking');
};

export const getMaxTokensForModel = (model: string): number => {
  if (isReasoningModel(model)) {
    return 2500; // Reasoning models need higher token limits
  }
  return 150; // Standard models
};
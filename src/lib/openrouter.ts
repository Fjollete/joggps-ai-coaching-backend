import axios, { AxiosResponse } from 'axios';
import { CoachingRequest, getMaxTokensForModel, isReasoningModel } from '@/types/coaching';

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  top_p: number;
  stream: boolean;
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const openRouterClient = axios.create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Title': 'JogGPS AI Coaching',
  },
  timeout: 30000, // 30 second timeout
});

export async function generateCoachingMessage(request: CoachingRequest): Promise<string> {
  const model = request.model || 'openai/gpt-4.1-nano';
  const maxTokens = getMaxTokensForModel(model);
  
  // Build context-aware system prompt
  const systemPrompt = buildSystemPrompt(request.trainingGoal);
  
  // Build user prompt with current running context
  const userPrompt = buildUserPrompt(request);
  
  const openRouterRequest: OpenRouterRequest = {
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: maxTokens,
    temperature: 0.8, // Slightly creative but consistent
    top_p: 0.9,
    stream: false,
  };

  try {
    console.log(`=== AI COACHING REQUEST (${model}) ===`);
    console.log(`Max Tokens: ${maxTokens} (Reasoning Model: ${isReasoningModel(model)})`);
    console.log(`Request: ${JSON.stringify(openRouterRequest, null, 2)}`);
    
    const response: AxiosResponse<OpenRouterResponse> = await openRouterClient.post('/chat/completions', openRouterRequest);
    
    const message = response.data.choices[0]?.message?.content?.trim();
    
    if (!message) {
      throw new Error('Empty response from OpenRouter API');
    }

    console.log(`=== AI COACHING RESPONSE ===`);
    console.log(`Model: ${model}`);
    console.log(`Tokens Used: ${response.data.usage?.total_tokens || 'unknown'}`);
    console.log(`Message: ${message}`);
    console.log(`=== END RESPONSE ===`);

    return message;
  } catch (error: any) {
    console.error('Error calling OpenRouter API:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    throw new Error(`OpenRouter API error: ${error.message}`);
  }
}

function buildSystemPrompt(trainingGoal?: any): string {
  let basePrompt = `You are an expert AI running coach providing real-time guidance during runs. Give concise, motivational coaching messages (1-2 sentences max) based on the runner's current performance data.

Key guidelines:
- Be encouraging and specific to their current situation
- Mention pace, heart rate, or distance when relevant
- Keep messages under 50 words
- Focus on form, breathing, pacing, or mental strategies
- Be supportive but honest about performance`;

  if (trainingGoal) {
    basePrompt += `\n\nRunner's Training Goal: ${trainingGoal.raceType} in ${formatTime(trainingGoal.targetTime)} on ${trainingGoal.raceDate}. Tailor advice to help them achieve this specific goal.`;
  }

  return basePrompt;
}

function buildUserPrompt(request: CoachingRequest): string {
  const { runTotals, currentSegment, intervalData } = request;
  
  // Convert data to human-readable format
  const distance = (runTotals.distance / 1000).toFixed(2); // km
  const duration = formatTime(Math.floor(runTotals.duration / 1000)); // seconds
  const pace = formatPace(runTotals.avgPace); // min:sec per km
  
  let prompt = `Current run status:
- Distance: ${distance}km
- Duration: ${duration}
- Average pace: ${pace}/km`;

  if (runTotals.avgHeartRate) {
    prompt += `\n- Heart rate: ${runTotals.avgHeartRate} bpm`;
  }

  if (currentSegment.speed > 0) {
    const currentSpeed = (currentSegment.speed * 3.6).toFixed(1); // Convert m/s to km/h
    prompt += `\n- Current speed: ${currentSpeed} km/h`;
  }

  if (intervalData) {
    const intervalPace = formatPace(intervalData.lastIntervalPace);
    prompt += `\n- Recent interval pace: ${intervalPace}/km`;
    
    if (intervalData.pacePattern) {
      prompt += `\n- Pace trend: ${intervalData.pacePattern}`;
    }
  }

  prompt += `\n\nProvide a motivational coaching message based on this data.`;
  
  return prompt;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
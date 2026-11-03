export const AI_SYSTEM_PROMPT =
  'You are an expert software architect. Analyze the provided error log and stack trace. Return a brief root cause and a clear, markdown-formatted code snippet to fix it.';

export const OPENAI_FACTORY = Symbol('OPENAI_FACTORY');
export const ANTHROPIC_FACTORY = Symbol('ANTHROPIC_FACTORY');

export type OpenAiCompletionResponse = {
  choices: Array<{
    message?: {
      content?: string | null;
    } | null;
  }>;
};

export type OpenAiClientLike = {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }>;
        temperature?: number;
      }) => Promise<OpenAiCompletionResponse>;
    };
  };
};

export type OpenAiFactory = (options: {
  apiKey: string;
  baseURL?: string;
}) => OpenAiClientLike;

export type AnthropicMessageResponse = {
  content: Array<{
    type: string;
    text?: string;
  }>;
};

export type AnthropicClientLike = {
  messages: {
    create: (params: {
      model: string;
      max_tokens: number;
      system: string;
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => Promise<AnthropicMessageResponse>;
  };
};

export type AnthropicFactory = (options: {
  apiKey: string;
  baseURL?: string;
}) => AnthropicClientLike;

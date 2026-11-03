import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  AI_SYSTEM_PROMPT,
  ANTHROPIC_FACTORY,
  OPENAI_FACTORY,
  type AnthropicFactory,
  type OpenAiFactory,
} from './ai.constants.js';

export type AiProvider = 'openai' | 'anthropic';

export type AiSuggestFixInput = {
  errorMessage: string;
  stackTrace: string;
  environment?: string;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openAiFactory: OpenAiFactory;
  private readonly anthropicFactory: AnthropicFactory;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(OPENAI_FACTORY)
    openAiFactory?: OpenAiFactory,
    @Optional()
    @Inject(ANTHROPIC_FACTORY)
    anthropicFactory?: AnthropicFactory,
  ) {
    this.openAiFactory =
      openAiFactory ??
      ((options) =>
        new OpenAI({
          apiKey: options.apiKey,
          baseURL: options.baseURL,
        }));

    this.anthropicFactory =
      anthropicFactory ??
      ((options) =>
        new Anthropic({
          apiKey: options.apiKey,
          baseURL: options.baseURL,
        }));
  }

  /**
   * Suggest a code fix using the configured AI provider (`openai` | `anthropic`).
   * Missing keys or provider failures return a graceful mock string so workers stay healthy.
   */
  async suggestFix(input: AiSuggestFixInput): Promise<string> {
    const provider = this.resolveProvider();

    switch (provider) {
      case 'anthropic':
        return this.suggestWithAnthropic(input);
      case 'openai':
      default:
        return this.suggestWithOpenAi(input);
    }
  }

  private resolveProvider(): AiProvider {
    const configured = (
      this.configService.get<string>('AI_PROVIDER', 'openai') ?? 'openai'
    )
      .trim()
      .toLowerCase();

    if (configured === 'anthropic' || configured === 'claude') {
      return 'anthropic';
    }

    return 'openai';
  }

  private suggestWithMock(input: AiSuggestFixInput): string {
    const preview = input.stackTrace.split('\n')[0]?.trim() ?? 'unknown frame';

    return [
      'Mock AI solution (provider unavailable - graceful fallback):',
      `1. Reproduce the failure around: ${preview}`,
      `2. Add defensive null/undefined checks for "${input.errorMessage}".`,
      '3. Wrap the risky call in structured error handling and rethrow with context.',
      '4. Add a regression test covering this stack path before shipping.',
    ].join('\n');
  }

  private buildUserPrompt(input: AiSuggestFixInput): string {
    const environment = input.environment?.trim() || 'unknown';

    return [
      `Environment: ${environment}`,
      '',
      'Error message:',
      input.errorMessage,
      '',
      'Stack trace:',
      input.stackTrace,
    ].join('\n');
  }

  private async suggestWithOpenAi(input: AiSuggestFixInput): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    const model =
      this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini') ??
      'gpt-4o-mini';
    const baseURL = this.configService.get<string>(
      'OPENAI_BASE_URL',
      'https://api.openai.com/v1',
    );

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY missing - falling back to mock AI solution',
      );
      return this.suggestWithMock(input);
    }

    try {
      const client = this.openAiFactory({
        apiKey,
        baseURL,
      });

      const response = await client.chat.completions.create({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'user', content: this.buildUserPrompt(input) },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim();

      if (!content) {
        this.logger.warn(
          'OpenAI returned an empty completion - falling back to mock',
        );
        return this.suggestWithMock(input);
      }

      return content;
    } catch (error) {
      this.logger.error(
        `OpenAI suggestFix failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.suggestWithMock(input);
    }
  }

  private async suggestWithAnthropic(
    input: AiSuggestFixInput,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY')?.trim();
    const model =
      this.configService.get<string>(
        'ANTHROPIC_MODEL',
        'claude-3-5-sonnet-latest',
      ) ?? 'claude-3-5-sonnet-latest';
    const baseURL = this.configService.get<string>('ANTHROPIC_BASE_URL');

    if (!apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY missing - falling back to mock AI solution',
      );
      return this.suggestWithMock(input);
    }

    try {
      const client = this.anthropicFactory({
        apiKey,
        baseURL: baseURL || undefined,
      });

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: AI_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: this.buildUserPrompt(input),
          },
        ],
      });

      const text = response.content
        .filter(
          (block) =>
            block.type === 'text' && typeof block.text === 'string',
        )
        .map((block) => block.text)
        .join('\n')
        .trim();

      if (!text) {
        this.logger.warn(
          'Anthropic returned an empty completion - falling back to mock',
        );
        return this.suggestWithMock(input);
      }

      return text;
    } catch (error) {
      this.logger.error(
        `Anthropic suggestFix failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return this.suggestWithMock(input);
    }
  }
}

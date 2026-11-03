import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  AI_SYSTEM_PROMPT,
  ANTHROPIC_FACTORY,
  OPENAI_FACTORY,
  type AnthropicFactory,
  type AnthropicMessageResponse,
  type OpenAiClientLike,
  type OpenAiCompletionResponse,
  type OpenAiFactory,
} from './ai.constants.js';
import { AiService } from './ai.service.js';

type OpenAiCreateFn = OpenAiClientLike['chat']['completions']['create'];
type AnthropicCreateFn = ReturnType<AnthropicFactory>['messages']['create'];

describe('AiService', () => {
  let service: AiService;
  let configValues: Record<string, string | undefined>;
  let openAiCreate: jest.MockedFunction<OpenAiCreateFn>;
  let openAiFactory: jest.MockedFunction<OpenAiFactory>;
  let anthropicCreate: jest.MockedFunction<AnthropicCreateFn>;
  let anthropicFactory: jest.MockedFunction<AnthropicFactory>;

  const input = {
    errorMessage: 'Cannot read properties of undefined (reading "id")',
    stackTrace: 'at UserService.findById (user.service.ts:41:18)',
    environment: 'production',
  };

  const openAiSuccess: OpenAiCompletionResponse = {
    choices: [
      {
        message: {
          content:
            '## Root cause\nNull access on user.\n\n```ts\nif (!user) return null;\n```',
        },
      },
    ],
  };

  const anthropicSuccess: AnthropicMessageResponse = {
    content: [
      {
        type: 'text',
        text: '## Root cause\nNull access.\n\n```ts\nreturn user?.id;\n```',
      },
    ],
  };

  beforeEach(async () => {
    configValues = {
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: 'gpt-4o-mini',
      OPENAI_BASE_URL: 'https://api.openai.com/v1',
      ANTHROPIC_API_KEY: undefined,
      ANTHROPIC_MODEL: 'claude-3-5-sonnet-latest',
      ANTHROPIC_BASE_URL: undefined,
    };

    openAiCreate = jest
      .fn<OpenAiCreateFn>()
      .mockResolvedValue(openAiSuccess);

    openAiFactory = jest.fn<OpenAiFactory>().mockReturnValue({
      chat: {
        completions: {
          create: openAiCreate,
        },
      },
    });

    anthropicCreate = jest
      .fn<AnthropicCreateFn>()
      .mockResolvedValue(anthropicSuccess);

    anthropicFactory = jest.fn<AnthropicFactory>().mockReturnValue({
      messages: {
        create: anthropicCreate,
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key in configValues && configValues[key] !== undefined) {
                return configValues[key];
              }
              return defaultValue;
            }),
          },
        },
        {
          provide: OPENAI_FACTORY,
          useValue: openAiFactory,
        },
        {
          provide: ANTHROPIC_FACTORY,
          useValue: anthropicFactory,
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should default to openai and fall back to mock without an API key', async () => {
    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
    expect(solution).toContain(input.errorMessage);
    expect(solution).toContain('user.service.ts:41:18');
    expect(openAiFactory).not.toHaveBeenCalled();
    expect(anthropicFactory).not.toHaveBeenCalled();
  });

  it('should fall back to mock when openai is selected without an API key', async () => {
    configValues.AI_PROVIDER = 'openai';
    configValues.OPENAI_API_KEY = undefined;

    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
    expect(openAiFactory).not.toHaveBeenCalled();
  });

  it('should fall back to mock when anthropic is selected without an API key', async () => {
    configValues.AI_PROVIDER = 'anthropic';
    configValues.ANTHROPIC_API_KEY = undefined;

    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
    expect(anthropicFactory).not.toHaveBeenCalled();
  });

  it('should call the OpenAI SDK when AI_PROVIDER=openai and key is set', async () => {
    configValues.AI_PROVIDER = 'openai';
    configValues.OPENAI_API_KEY = 'sk-test-key';

    const solution = await service.suggestFix(input);

    expect(openAiFactory).toHaveBeenCalledWith({
      apiKey: 'sk-test-key',
      baseURL: 'https://api.openai.com/v1',
    });
    expect(openAiCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          {
            role: 'user',
            content: expect.stringContaining(input.errorMessage),
          },
        ],
      }),
    );
    expect(solution).toContain('Root cause');
    expect(solution).toContain('```ts');
    expect(anthropicFactory).not.toHaveBeenCalled();
  });

  it('should call the Anthropic SDK when AI_PROVIDER=anthropic and key is set', async () => {
    configValues.AI_PROVIDER = 'anthropic';
    configValues.ANTHROPIC_API_KEY = 'anthropic-test-key';

    const solution = await service.suggestFix(input);

    expect(anthropicFactory).toHaveBeenCalledWith({
      apiKey: 'anthropic-test-key',
      baseURL: undefined,
    });
    expect(anthropicCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        system: AI_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining(input.stackTrace),
          },
        ],
      }),
    );
    expect(solution).toContain('Root cause');
    expect(solution).toContain('```ts');
    expect(openAiFactory).not.toHaveBeenCalled();
  });

  it('should treat AI_PROVIDER=claude as anthropic', async () => {
    configValues.AI_PROVIDER = 'claude';
    configValues.ANTHROPIC_API_KEY = 'anthropic-test-key';

    await service.suggestFix(input);

    expect(anthropicFactory).toHaveBeenCalledTimes(1);
    expect(openAiFactory).not.toHaveBeenCalled();
  });

  it('should gracefully fall back to mock when OpenAI SDK fails', async () => {
    configValues.AI_PROVIDER = 'openai';
    configValues.OPENAI_API_KEY = 'sk-test-key';
    openAiCreate.mockRejectedValueOnce(new Error('rate limited'));

    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
    expect(solution).toContain(input.errorMessage);
  });

  it('should gracefully fall back to mock when Anthropic SDK fails', async () => {
    configValues.AI_PROVIDER = 'anthropic';
    configValues.ANTHROPIC_API_KEY = 'anthropic-test-key';
    anthropicCreate.mockRejectedValueOnce(new Error('overloaded'));

    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
    expect(solution).toContain(input.errorMessage);
  });

  it('should fall back to mock when OpenAI returns an empty completion', async () => {
    configValues.AI_PROVIDER = 'openai';
    configValues.OPENAI_API_KEY = 'sk-test-key';
    openAiCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '   ' } }],
    });

    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
  });

  it('should fall back to mock when Anthropic returns no text blocks', async () => {
    configValues.AI_PROVIDER = 'anthropic';
    configValues.ANTHROPIC_API_KEY = 'anthropic-test-key';
    anthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use' }],
    });

    const solution = await service.suggestFix(input);

    expect(solution).toContain('Mock AI solution');
  });
});

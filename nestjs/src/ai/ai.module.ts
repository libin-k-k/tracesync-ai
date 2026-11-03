import { Module } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  ANTHROPIC_FACTORY,
  OPENAI_FACTORY,
  type AnthropicFactory,
  type OpenAiFactory,
} from './ai.constants.js';
import { AiService } from './ai.service.js';

const defaultOpenAiFactory: OpenAiFactory = (options) =>
  new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

const defaultAnthropicFactory: AnthropicFactory = (options) =>
  new Anthropic({
    apiKey: options.apiKey,
    baseURL: options.baseURL,
  });

@Module({
  providers: [
    AiService,
    {
      provide: OPENAI_FACTORY,
      useValue: defaultOpenAiFactory,
    },
    {
      provide: ANTHROPIC_FACTORY,
      useValue: defaultAnthropicFactory,
    },
  ],
  exports: [AiService],
})
export class AiModule {}

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Redis } from 'ioredis';
import { TENANT_API_KEY_PREFIX } from '../redis/redis.constants.js';
import { ApiKeyGuard } from './api-key.guard.js';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let redis: {
    get: ReturnType<typeof jest.fn>;
  };

  const createContext = (
    apiKeyHeader: string | string[] | undefined,
  ): ExecutionContext => {
    const request: {
      headers: Record<string, string | string[] | undefined>;
      tenant_id?: string;
      api_key?: string;
    } = {
      headers: {
        'x-api-key': apiKeyHeader,
      },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(() => {
    redis = {
      get: jest.fn(),
    };

    guard = new ApiKeyGuard(redis as unknown as Redis);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow the request when Redis contains the API key mapping', async () => {
    const apiKey = 'ts_live_abc123validkey0000000000000000';
    redis.get.mockResolvedValue('42');

    const context = createContext(apiKey);
    const allowed = await guard.canActivate(context);
    const request = context.switchToHttp().getRequest<{
      tenant_id?: string;
      api_key?: string;
    }>();

    expect(allowed).toBe(true);
    expect(redis.get).toHaveBeenCalledWith(`${TENANT_API_KEY_PREFIX}${apiKey}`);
    expect(request.tenant_id).toBe('42');
    expect(request.api_key).toBe(apiKey);
  });

  it('should reject missing x-api-key with 401', async () => {
    const context = createContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('should reject empty x-api-key with 401', async () => {
    const context = createContext('   ');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('should reject invalid API keys missing from Redis with 401', async () => {
    const apiKey = 'ts_live_unknownkey000000000000000000';
    redis.get.mockResolvedValue(null);

    const context = createContext(apiKey);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(redis.get).toHaveBeenCalledWith(`${TENANT_API_KEY_PREFIX}${apiKey}`);
  });

  it('should reject blank Redis values as invalid keys', async () => {
    redis.get.mockResolvedValue('   ');

    const context = createContext('ts_live_blankvalue000000000000000000');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

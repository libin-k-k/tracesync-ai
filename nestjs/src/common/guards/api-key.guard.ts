import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  REDIS_CLIENT,
  TENANT_API_KEY_PREFIX,
} from '../redis/redis.constants.js';
import type { AuthenticatedIngestRequest } from '../types/authenticated-request.js';

/**
 * Validates x-api-key against Redis mappings written by Laravel TenantService.
 * Redis key format: tenant_api_key:{api_key} -> tenant_id
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedIngestRequest>();
    const apiKey = this.normalizeApiKey(request.headers['x-api-key']);

    if (apiKey === null) {
      throw new UnauthorizedException({
        success: false,
        status: 401,
        message: 'Missing or invalid x-api-key header',
        error_code: 'API_KEY_REQUIRED',
      });
    }

    const tenantId = await this.redis.get(`${TENANT_API_KEY_PREFIX}${apiKey}`);

    if (tenantId === null || tenantId.trim() === '') {
      throw new UnauthorizedException({
        success: false,
        status: 401,
        message: 'Invalid API key',
        error_code: 'API_KEY_INVALID',
      });
    }

    request.api_key = apiKey;
    request.tenant_id = tenantId.trim();
    request.headers['x-api-key'] = apiKey;

    return true;
  }

  private normalizeApiKey(value: string | string[] | undefined): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(value) && value.length > 0) {
      const trimmed = value[0]?.trim() ?? '';
      return trimmed.length > 0 ? trimmed : null;
    }

    return null;
  }
}

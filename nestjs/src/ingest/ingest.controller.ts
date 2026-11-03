import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import type { AuthenticatedIngestRequest } from '../common/types/authenticated-request.js';
import { CreateErrorLogDto } from './dto/create-error-log.dto.js';
import { IngestService } from './ingest.service.js';

export type IngestAcceptedResponse = {
  success: true;
  status: typeof HttpStatus.ACCEPTED;
  message: string;
  data: {
    job_id: string;
    queue: string;
  };
};

@Controller('errors')
@UseGuards(ApiKeyGuard)
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async store(
    @Req() request: AuthenticatedIngestRequest,
    @Body() createErrorLogDto: CreateErrorLogDto,
  ): Promise<IngestAcceptedResponse> {
    const tenantId = request.tenant_id?.trim();

    if (!tenantId) {
      throw new UnauthorizedException({
        success: false,
        status: 401,
        message: 'Authenticated tenant context is required',
        error_code: 'TENANT_CONTEXT_REQUIRED',
      });
    }

    const queued = await this.ingestService.enqueueErrorLog(
      createErrorLogDto,
      tenantId,
    );

    return {
      success: true,
      status: HttpStatus.ACCEPTED,
      message: 'Error log accepted and queued for processing',
      data: {
        job_id: queued.jobId,
        queue: queued.queue,
      },
    };
  }
}

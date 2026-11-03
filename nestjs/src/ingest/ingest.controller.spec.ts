import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ERROR_LOGS_QUEUE } from '../common/constants/queues.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import type { AuthenticatedIngestRequest } from '../common/types/authenticated-request.js';
import type { CreateErrorLogDto } from './dto/create-error-log.dto.js';
import { IngestController } from './ingest.controller.js';
import { IngestService } from './ingest.service.js';

describe('IngestController', () => {
  let controller: IngestController;
  let ingestService: {
    enqueueErrorLog: ReturnType<typeof jest.fn>;
  };

  const payload: CreateErrorLogDto = {
    project_id: '42',
    error_message: 'TypeError: Cannot read properties of null',
    stack_trace: 'at CheckoutService.pay (checkout.service.ts:88:11)',
    environment: 'production',
  };

  const request = {
    tenant_id: '88',
  } as AuthenticatedIngestRequest;

  beforeEach(async () => {
    ingestService = {
      enqueueErrorLog: jest.fn().mockResolvedValue({
        jobId: 'job-123',
        queue: ERROR_LOGS_QUEUE,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestController],
      providers: [
        {
          provide: IngestService,
          useValue: ingestService,
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IngestController>(IngestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should enqueue the payload with tenant_id and return 202 Accepted', async () => {
    const response = await controller.store(request, payload);

    expect(ingestService.enqueueErrorLog).toHaveBeenCalledTimes(1);
    expect(ingestService.enqueueErrorLog).toHaveBeenCalledWith(payload, '88');
    expect(response).toEqual({
      success: true,
      status: HttpStatus.ACCEPTED,
      message: 'Error log accepted and queued for processing',
      data: {
        job_id: 'job-123',
        queue: ERROR_LOGS_QUEUE,
      },
    });
  });

  it('should propagate enqueue failures', async () => {
    ingestService.enqueueErrorLog.mockRejectedValueOnce(
      new Error('Redis unavailable'),
    );

    await expect(controller.store(request, payload)).rejects.toThrow(
      'Redis unavailable',
    );
  });
});

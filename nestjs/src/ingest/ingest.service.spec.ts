import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ERROR_LOGS_JOB, ERROR_LOGS_QUEUE } from '../common/constants/queues.js';
import type { CreateErrorLogDto } from './dto/create-error-log.dto.js';
import { IngestService } from './ingest.service.js';

describe('IngestService', () => {
  let service: IngestService;
  let queue: {
    add: ReturnType<typeof jest.fn>;
  };

  const payload: CreateErrorLogDto = {
    project_id: '7',
    error_message: 'NullReferenceException',
    stack_trace: 'at OrderService.place()',
    environment: 'staging',
  };

  beforeEach(async () => {
    queue = {
      add: jest.fn().mockResolvedValue({ id: 'bull-job-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestService,
        {
          provide: getQueueToken(ERROR_LOGS_QUEUE),
          useValue: queue,
        },
      ],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should push the validated payload with tenant_id onto error-logs-queue', async () => {
    const result = await service.enqueueErrorLog(payload, '55');

    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add).toHaveBeenCalledWith(
      ERROR_LOGS_JOB,
      {
        tenant_id: '55',
        project_id: payload.project_id,
        error_message: payload.error_message,
        stack_trace: payload.stack_trace,
        environment: payload.environment,
      },
      expect.objectContaining({
        attempts: 3,
        removeOnComplete: 1000,
        removeOnFail: 5000,
      }),
    );
    expect(result).toEqual({
      jobId: 'bull-job-1',
      queue: ERROR_LOGS_QUEUE,
    });
  });

  it('should fall back to unknown job id when Bull returns no id', async () => {
    queue.add.mockResolvedValueOnce({});

    const result = await service.enqueueErrorLog(payload, '1');

    expect(result.jobId).toBe('unknown');
  });

  it('should rethrow queue errors', async () => {
    queue.add.mockRejectedValueOnce(new Error('connection refused'));

    await expect(service.enqueueErrorLog(payload, '1')).rejects.toThrow(
      'connection refused',
    );
  });
});

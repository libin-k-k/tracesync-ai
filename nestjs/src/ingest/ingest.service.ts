import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { JobsOptions, Queue } from 'bullmq';
import { ERROR_LOGS_JOB, ERROR_LOGS_QUEUE } from '../common/constants/queues.js';
import type {
  CreateErrorLogDto,
  ErrorLogJobPayload,
} from './dto/create-error-log.dto.js';

export type QueuedErrorLogJob = {
  jobId: string;
  queue: typeof ERROR_LOGS_QUEUE;
};

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  private readonly defaultJobOptions: JobsOptions = {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  };

  constructor(
    @InjectQueue(ERROR_LOGS_QUEUE)
    private readonly errorLogsQueue: Queue<ErrorLogJobPayload>,
  ) {}

  /**
   * Enqueue an error log for async processing. Does not wait for a consumer.
   */
  async enqueueErrorLog(
    payload: CreateErrorLogDto,
    tenantId: string,
  ): Promise<QueuedErrorLogJob> {
    const jobPayload: ErrorLogJobPayload = {
      tenant_id: tenantId,
      project_id: payload.project_id,
      error_message: payload.error_message,
      stack_trace: payload.stack_trace,
      environment: payload.environment,
    };

    const job = await this.errorLogsQueue.add(
      ERROR_LOGS_JOB,
      jobPayload,
      this.defaultJobOptions,
    );

    const jobId = job.id ?? 'unknown';

    this.logger.debug(
      `Queued error log job ${jobId} for tenant ${tenantId} project ${payload.project_id}`,
    );

    return {
      jobId,
      queue: ERROR_LOGS_QUEUE,
    };
  }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service.js';
import { ERROR_LOGS_QUEUE } from '../common/constants/queues.js';
import { DashboardGateway } from '../dashboard/dashboard.gateway.js';
import { ErrorLog } from '../error-logs/entities/error-log.entity.js';
import type { ErrorLogJobPayload } from './dto/create-error-log.dto.js';

@Injectable()
@Processor(ERROR_LOGS_QUEUE)
export class ErrorLogsProcessor extends WorkerHost {
  private readonly logger = new Logger(ErrorLogsProcessor.name);

  constructor(
    private readonly aiService: AiService,
    private readonly dashboardGateway: DashboardGateway,
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
  ) {
    super();
  }

  async process(job: Job<ErrorLogJobPayload>): Promise<ErrorLog> {
    const payload = job.data;

    this.logger.debug(
      `Processing error log job ${job.id ?? 'unknown'} for tenant ${payload.tenant_id} project ${payload.project_id}`,
    );

    const aiSolution = await this.aiService.suggestFix({
      errorMessage: payload.error_message,
      stackTrace: payload.stack_trace,
      environment: payload.environment,
    });

    const errorLog = this.errorLogRepository.create({
      tenant_id: payload.tenant_id,
      project_id: payload.project_id,
      error_message: payload.error_message,
      stack_trace: payload.stack_trace,
      ai_solution: aiSolution,
    });

    const saved = await this.errorLogRepository.save(errorLog);

    this.dashboardGateway.emitNewErrorAlert(saved.tenant_id, saved);

    this.logger.debug(
      `Persisted error_logs id=${saved.id} for tenant ${saved.tenant_id} project ${saved.project_id}`,
    );

    return saved;
  }
}

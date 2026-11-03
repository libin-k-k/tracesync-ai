import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module.js';
import { ERROR_LOGS_QUEUE } from '../common/constants/queues.js';
import { ApiKeyGuard } from '../common/guards/api-key.guard.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';
import { ErrorLog } from '../error-logs/entities/error-log.entity.js';
import { ErrorLogsProcessor } from './error-logs.processor.js';
import { IngestController } from './ingest.controller.js';
import { IngestService } from './ingest.service.js';

@Module({
  imports: [
    AiModule,
    DashboardModule,
    TypeOrmModule.forFeature([ErrorLog]),
    BullModule.registerQueue({
      name: ERROR_LOGS_QUEUE,
    }),
  ],
  controllers: [IngestController],
  providers: [IngestService, ApiKeyGuard, ErrorLogsProcessor],
  exports: [IngestService, TypeOrmModule],
})
export class IngestModule {}

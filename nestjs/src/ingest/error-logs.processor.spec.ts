import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AiService } from '../ai/ai.service.js';
import { DashboardGateway } from '../dashboard/dashboard.gateway.js';
import { ErrorLog } from '../error-logs/entities/error-log.entity.js';
import type { ErrorLogJobPayload } from './dto/create-error-log.dto.js';
import { ErrorLogsProcessor } from './error-logs.processor.js';

describe('ErrorLogsProcessor', () => {
  let processor: ErrorLogsProcessor;
  let aiService: {
    suggestFix: ReturnType<typeof jest.fn>;
  };
  let dashboardGateway: {
    emitNewErrorAlert: ReturnType<typeof jest.fn>;
  };
  let errorLogRepository: {
    create: ReturnType<typeof jest.fn>;
    save: ReturnType<typeof jest.fn>;
  };

  const payload: ErrorLogJobPayload = {
    tenant_id: '11',
    project_id: '99',
    error_message: 'Payment gateway timeout',
    stack_trace: 'at PaymentClient.charge (payment.client.ts:120:5)',
    environment: 'production',
  };

  const mockJob = {
    id: 'job-55',
    data: payload,
  } as Job<ErrorLogJobPayload>;

  beforeEach(async () => {
    aiService = {
      suggestFix: jest.fn().mockResolvedValue('Mocked AI fix for payment timeout'),
    };

    dashboardGateway = {
      emitNewErrorAlert: jest.fn(),
    };

    const createdEntity = {
      tenant_id: payload.tenant_id,
      project_id: payload.project_id,
      error_message: payload.error_message,
      stack_trace: payload.stack_trace,
      ai_solution: 'Mocked AI fix for payment timeout',
    };

    const savedEntity = {
      id: 17,
      ...createdEntity,
      created_at: new Date('2026-10-31T12:00:00.000Z'),
    };

    errorLogRepository = {
      create: jest.fn().mockReturnValue(createdEntity),
      save: jest.fn().mockResolvedValue(savedEntity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorLogsProcessor,
        {
          provide: AiService,
          useValue: aiService,
        },
        {
          provide: DashboardGateway,
          useValue: dashboardGateway,
        },
        {
          provide: getRepositoryToken(ErrorLog),
          useValue: errorLogRepository,
        },
      ],
    }).compile();

    processor = module.get<ErrorLogsProcessor>(ErrorLogsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should call AiService, persist the error log, and emit new_error_alert', async () => {
    const saved = await processor.process(mockJob);

    expect(aiService.suggestFix).toHaveBeenCalledTimes(1);
    expect(aiService.suggestFix).toHaveBeenCalledWith({
      errorMessage: payload.error_message,
      stackTrace: payload.stack_trace,
      environment: payload.environment,
    });

    expect(errorLogRepository.create).toHaveBeenCalledWith({
      tenant_id: payload.tenant_id,
      project_id: payload.project_id,
      error_message: payload.error_message,
      stack_trace: payload.stack_trace,
      ai_solution: 'Mocked AI fix for payment timeout',
    });

    expect(errorLogRepository.save).toHaveBeenCalledTimes(1);
    expect(dashboardGateway.emitNewErrorAlert).toHaveBeenCalledTimes(1);
    expect(dashboardGateway.emitNewErrorAlert).toHaveBeenCalledWith(
      payload.tenant_id,
      expect.objectContaining({
        id: 17,
        tenant_id: payload.tenant_id,
        ai_solution: 'Mocked AI fix for payment timeout',
      }),
    );
    expect(saved.id).toBe(17);
    expect(saved.ai_solution).toBe('Mocked AI fix for payment timeout');
    expect(saved.project_id).toBe(payload.project_id);
    expect(saved.tenant_id).toBe(payload.tenant_id);
  });

  it('should not save or emit when AiService fails', async () => {
    aiService.suggestFix.mockRejectedValueOnce(new Error('AI unavailable'));

    await expect(processor.process(mockJob)).rejects.toThrow('AI unavailable');
    expect(errorLogRepository.save).not.toHaveBeenCalled();
    expect(dashboardGateway.emitNewErrorAlert).not.toHaveBeenCalled();
  });

  it('should not emit when repository save fails', async () => {
    errorLogRepository.save.mockRejectedValueOnce(new Error('MySQL down'));

    await expect(processor.process(mockJob)).rejects.toThrow('MySQL down');
    expect(aiService.suggestFix).toHaveBeenCalledTimes(1);
    expect(dashboardGateway.emitNewErrorAlert).not.toHaveBeenCalled();
  });
});

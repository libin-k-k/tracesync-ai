import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from './entities/error-log.entity.js';

const HISTORY_LIMIT = 50;

@Injectable()
export class ErrorLogsService {
  constructor(
    @InjectRepository(ErrorLog)
    private readonly errorLogRepository: Repository<ErrorLog>,
  ) {}

  listForTenant(tenantId: string): Promise<ErrorLog[]> {
    return this.errorLogRepository.find({
      where: { tenant_id: tenantId },
      order: { created_at: 'DESC', id: 'DESC' },
      take: HISTORY_LIMIT,
    });
  }

  findForTenant(tenantId: string, id: number): Promise<ErrorLog | null> {
    return this.errorLogRepository.findOne({
      where: { tenant_id: tenantId, id },
    });
  }
}

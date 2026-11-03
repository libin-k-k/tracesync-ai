import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ListErrorLogsQuery } from './dto/list-error-logs.query.js';
import type { ErrorLog } from './entities/error-log.entity.js';
import { ErrorLogsService } from './error-logs.service.js';

function presentErrorLog(row: ErrorLog) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    project_id: row.project_id,
    error_message: row.error_message,
    stack_trace: row.stack_trace,
    ai_solution: row.ai_solution,
    created_at: row.created_at,
  };
}

@Controller('error-logs')
export class ErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Get()
  async index(@Query() query: ListErrorLogsQuery) {
    const rows = await this.errorLogsService.listForTenant(query.tenant_id.trim());

    return {
      success: true,
      data: rows.map(presentErrorLog),
    };
  }

  @Get(':id')
  async show(@Param('id') id: string, @Query() query: ListErrorLogsQuery) {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId < 1) {
      throw new BadRequestException({
        success: false,
        message: 'Error id must be a positive integer',
      });
    }

    const row = await this.errorLogsService.findForTenant(
      query.tenant_id.trim(),
      numericId,
    );

    if (!row) {
      throw new NotFoundException({
        success: false,
        message: 'Error log not found',
      });
    }

    return {
      success: true,
      data: presentErrorLog(row),
    };
  }
}

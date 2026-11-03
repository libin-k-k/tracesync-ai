import axios from 'axios'
import { env } from '../config/env'
import type { ErrorAlertPayload } from '../types/error-alert'

function isHistoryRow(value: unknown): value is ErrorAlertPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const row = value as Partial<ErrorAlertPayload>

  return (
    typeof row.id === 'number' &&
    typeof row.tenant_id === 'string' &&
    typeof row.project_id === 'string' &&
    typeof row.error_message === 'string' &&
    typeof row.ai_solution === 'string'
  )
}

function normalizeRow(row: ErrorAlertPayload): ErrorAlertPayload {
  return {
    ...row,
    stack_trace: typeof row.stack_trace === 'string' ? row.stack_trace : '',
    created_at: row.created_at ? String(row.created_at) : '',
  }
}

export async function fetchErrorHistory(tenantId: string): Promise<ErrorAlertPayload[]> {
  const response = await axios.get<{ data?: unknown }>(`${env.nestjsUrl}/api/v1/error-logs`, {
    params: { tenant_id: tenantId },
    timeout: 15_000,
  })

  const rows = response.data?.data
  if (!Array.isArray(rows)) {
    return []
  }

  return rows.filter(isHistoryRow).map(normalizeRow)
}

export async function fetchErrorDetail(
  tenantId: string,
  id: string,
): Promise<ErrorAlertPayload | null> {
  try {
    const response = await axios.get<{ data?: unknown }>(
      `${env.nestjsUrl}/api/v1/error-logs/${id}`,
      {
        params: { tenant_id: tenantId },
        timeout: 15_000,
      },
    )

    return isHistoryRow(response.data?.data) ? normalizeRow(response.data.data) : null
  } catch {
    return null
  }
}

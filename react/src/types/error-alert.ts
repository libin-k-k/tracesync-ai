export const NEW_ERROR_ALERT_EVENT = 'new_error_alert' as const;

export type ErrorAlertPayload = {
  id: number;
  tenant_id: string;
  project_id: string;
  error_message: string;
  stack_trace: string;
  ai_solution: string;
  created_at: string;
};

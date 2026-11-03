export const DASHBOARD_NEW_ERROR_ALERT = 'new_error_alert' as const;

export function tenantRoomName(tenantId: string | number): string {
  return `room_tenant_${tenantId}`;
}

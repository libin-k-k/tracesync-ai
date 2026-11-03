import type { Request } from 'express';

export type AuthenticatedIngestRequest = Request & {
  tenant_id?: string;
  api_key?: string;
};

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Socket } from 'socket.io';
import type { ErrorLog } from '../error-logs/entities/error-log.entity.js';
import {
  DASHBOARD_NEW_ERROR_ALERT,
  tenantRoomName,
} from './dashboard.constants.js';
import { DashboardGateway } from './dashboard.gateway.js';

describe('DashboardGateway', () => {
  let gateway: DashboardGateway;
  let emit: ReturnType<typeof jest.fn>;
  let to: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    gateway = new DashboardGateway();
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as unknown as DashboardGateway['server'];
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should join room_tenant_{id} when tenant_id is provided in handshake query', () => {
    const join = jest.fn();
    const disconnect = jest.fn();
    const client = {
      id: 'socket-1',
      handshake: { query: { tenant_id: '7' } },
      join,
      disconnect,
    } as unknown as Socket;

    gateway.handleConnection(client);

    expect(join).toHaveBeenCalledWith(tenantRoomName(7));
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('should disconnect clients that omit tenant_id', () => {
    const join = jest.fn();
    const disconnect = jest.fn();
    const client = {
      id: 'socket-2',
      handshake: { query: {} },
      join,
      disconnect,
    } as unknown as Socket;

    gateway.handleConnection(client);

    expect(join).not.toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalledWith(true);
  });

  it('should emit new_error_alert to the tenant room', () => {
    const errorLog = {
      id: 42,
      tenant_id: '3',
      project_id: '99',
      error_message: 'Boom',
      stack_trace: 'at fail()',
      ai_solution: 'Fix it',
      created_at: new Date('2026-10-31T12:00:00.000Z'),
    } as ErrorLog;

    gateway.emitNewErrorAlert('3', errorLog);

    expect(to).toHaveBeenCalledWith(tenantRoomName(3));
    expect(emit).toHaveBeenCalledWith(DASHBOARD_NEW_ERROR_ALERT, {
      id: 42,
      tenant_id: '3',
      project_id: '99',
      error_message: 'Boom',
      stack_trace: 'at fail()',
      ai_solution: 'Fix it',
      created_at: errorLog.created_at,
    });
  });
});

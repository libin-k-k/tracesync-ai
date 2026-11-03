import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { ErrorLog } from '../error-logs/entities/error-log.entity.js';
import {
  DASHBOARD_NEW_ERROR_ALERT,
  tenantRoomName,
} from './dashboard.constants.js';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class DashboardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DashboardGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit(): void {
    this.logger.log('Dashboard WebSocket gateway initialized');
  }

  handleConnection(client: Socket): void {
    const tenantId = this.extractTenantId(client);

    if (tenantId === null) {
      this.logger.warn(
        `Rejecting socket ${client.id}: missing or invalid tenant_id query`,
      );
      client.disconnect(true);
      return;
    }

    const room = tenantRoomName(tenantId);
    void client.join(room);

    this.logger.debug(
      `Socket ${client.id} joined ${room}`,
    );
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Socket ${client.id} disconnected`);
  }

  /**
   * Broadcast a persisted, AI-enriched error log to the tenant's dashboard room.
   */
  emitNewErrorAlert(tenantId: string | number, errorLog: ErrorLog): void {
    const room = tenantRoomName(tenantId);

    this.server.to(room).emit(DASHBOARD_NEW_ERROR_ALERT, {
      id: errorLog.id,
      tenant_id: errorLog.tenant_id,
      project_id: errorLog.project_id,
      error_message: errorLog.error_message,
      stack_trace: errorLog.stack_trace,
      ai_solution: errorLog.ai_solution,
      created_at: errorLog.created_at,
    });

    this.logger.debug(
      `Emitted ${DASHBOARD_NEW_ERROR_ALERT} to ${room} for error_logs id=${errorLog.id}`,
    );
  }

  private extractTenantId(client: Socket): string | null {
    const raw = client.handshake.query.tenant_id;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
      const trimmed = raw[0].trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    return null;
  }
}

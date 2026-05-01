import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../auth/auth.types';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { NotificationType, NotificationPayload } from './notification.types';

@WebSocketGateway({
  cors: { origin: '*' }, // Настройте CORS
  namespace: 'notifications',
})
@UseGuards(WsJwtGuard)
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Хранилище активных пользователей: userId -> Socket ID
  private activeUsers = new Map<number, string>();

  handleConnection(client: AuthenticatedSocket) {
    // Если мы здесь, значит, WsJwtGuard пропустил соединение
    const user = client.data.user;
    if (user && user.sub) {
      this.activeUsers.set(user.sub, client.id);
      console.log(`Client connected: ${client.id} (User ID: ${user.sub})`);
    } else {
      // На всякий случай, если guard почему-то не сработал
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user && user.sub) {
      this.activeUsers.delete(user.sub);
      console.log(`Client disconnected: ${client.id} (User ID: ${user.sub})`);
    }
  }

  // Метод для отправки уведомления конкретному пользователю
  sendNotification(userId: number, type: NotificationType, data: Record<string, any>) {
    const socketId = this.activeUsers.get(userId);
    if (socketId) {
      const payload: NotificationPayload = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      this.server.to(socketId).emit('notification', payload);
      console.log(` Notification sent to user ${userId}: ${type}`);
    }
  }
}
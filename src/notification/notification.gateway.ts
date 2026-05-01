import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

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

  handleConnection(client: Socket) {
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

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user && user.sub) {
      this.activeUsers.delete(user.sub);
      console.log(`Client disconnected: ${client.id} (User ID: ${user.sub})`);
    }
  }

  // Метод для отправки уведомления конкретному пользователю
  sendNotification(userId: number, message: any) {
    const socketId = this.activeUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', message);
    }
  }
}
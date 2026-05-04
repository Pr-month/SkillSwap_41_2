import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket  } from 'socket.io';
import { WsAuthService } from '../auth/ws-auth.service';
import { NotificationType, NotificationPayload } from './notification.types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'notifications',
})
export class NotificationGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private wsAuthService: WsAuthService) {}
  async handleConnection(client: Socket) {
    let token: string | undefined;

    // Извлекаем токен из handshake
    if (client.handshake?.query?.token) {
      token = client.handshake.query.token as string;
    } else if (client.handshake?.headers?.authorization) {
      const authHeader = client.handshake.headers.authorization;
      const [type, extractedToken] = authHeader.split(' ');
      if (type === 'Bearer' && extractedToken) {
        token = extractedToken;
      }
    } else if (client.handshake?.auth?.token) {
      token = client.handshake.auth.token as string;
    }

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.wsAuthService.validateToken(token);
      const userId = payload.sub;
      // Добавляем клиента в комнату с именем = его userId
      client.join(userId.toString());
      console.log(`Client ${client.id} joined room: ${userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Клиент автоматически покидает все комнаты при отключении
    console.log(`Client disconnected: ${client.id}`);
  }

  // Метод для отправки уведомления конкретному пользователю
  sendNotification(userId: number, type: NotificationType, data: Record<string, any>) {
    const payload: NotificationPayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };
    // Отправляем в комнату с именем userId
    this.server.to(userId.toString()).emit('notification', payload);
    console.log(`Notification sent to user ${userId}`);
  }
}
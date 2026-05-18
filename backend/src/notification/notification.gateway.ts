import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
    try {
      const payload = await this.wsAuthService.authenticateSocket(client);
      const userId = payload.sub;
      // Добавляем клиента в комнату с именем = его userId
      await client.join(userId.toString());
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
  sendNotification(
    userId: number,
    type: NotificationType,
    data: Record<string, unknown>,
  ) {
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

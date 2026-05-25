import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { SendmailService } from '../sendmail/sendmail.service';
import { User } from '../users/entities/user.entity';

export interface NewRequestData {
  requestId: string;
  senderName: string;
  offeredSkillTitle: string;
  requestedSkillTitle: string;
}

export interface RequestAcceptedData {
  requestId: string;
  receiverName: string;
  offeredSkillTitle: string;
}

export interface RequestRejectedData {
  requestId: string;
  receiverName: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly sendmailService: SendmailService,
  ) {}

  async notifyNewRequest(receiver: User, data: NewRequestData) {
    // WebSocket уведомление
    this.notificationGateway.sendNotification(receiver.id, 'new_request', {
      requestId: data.requestId,
      senderName: data.senderName,
      offeredSkillTitle: data.offeredSkillTitle,
      requestedSkillTitle: data.requestedSkillTitle,
    });
    // Email уведомление
    try {
      await this.sendmailService.sendEmail({
        to: receiver.email,
        subject: 'Новая заявка на обмен навыками',
        html: `
          <h2>Новая заявка от ${data.senderName}</h2>
          <p>Пользователь предлагает: <strong>${data.offeredSkillTitle}</strong></p>
          <p>и хочет получить: <strong>${data.requestedSkillTitle}</strong></p>
          <p>Перейдите в приложение, чтобы принять или отклонить заявку.</p>
        `,
        text: `Новая заявка от ${data.senderName}. Предлагает: ${data.offeredSkillTitle}, хочет получить: ${data.requestedSkillTitle}`,
      });
    } catch (error) {
      console.error(
        'Failed to send email notification for new request:',
        error,
      );
    }
  }

  async notifyRequestAccepted(sender: User, data: RequestAcceptedData) {
    // WebSocket уведомление
    this.notificationGateway.sendNotification(sender.id, 'request_accepted', {
      requestId: data.requestId,
      receiverName: data.receiverName,
      offeredSkillTitle: data.offeredSkillTitle,
    });
    // Email уведомление
    try {
      await this.sendmailService.sendEmail({
        to: sender.email,
        subject: 'Ваша заявка принята',
        html: `
          <h2>Заявка принята!</h2>
          <p>Пользователь ${data.receiverName} принял ваш запрос на обмен навыком <strong>${data.offeredSkillTitle}</strong>.</p>
          <p>Вы можете связаться с ним в приложении.</p>
        `,
        text: `Заявка принята пользователем ${data.receiverName} по навыку ${data.offeredSkillTitle}`,
      });
    } catch (error) {
      console.error('Failed to send email for request accepted:', error);
    }
  }

  async notifyRequestRejected(sender: User, data: RequestRejectedData) {
    // WebSocket уведомление
    this.notificationGateway.sendNotification(sender.id, 'request_rejected', {
      requestId: data.requestId,
      receiverName: data.receiverName,
    });
    // Email уведомление
    try {
      await this.sendmailService.sendEmail({
        to: sender.email,
        subject: 'Заявка отклонена',
        html: `
          <h2>Заявка отклонена</h2>
          <p>Пользователь ${data.receiverName} отклонил вашу заявку.</p>
        `,
        text: `Заявка отклонена пользователем ${data.receiverName}`,
      });
    } catch (error) {
      console.error('Failed to send email for request rejected:', error);
    }
  }
}

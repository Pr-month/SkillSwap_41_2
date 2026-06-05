import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendmailDto } from './dto/sendmail.dto';
import { sendmailConfig } from '../config/sendmail.config';
import type { TSendmailConfig } from '../config/sendmail.config';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class SendmailService implements OnModuleInit {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(sendmailConfig.KEY)
    private readonly config: TSendmailConfig,
  ) {}

  async onModuleInit() {
    // Проверяем, не отключена ли отправка писем
    if (this.isEmailDisabled()) {
      console.log('=== Email sending is DISABLED ===');
      return;
    }
    await this.verifyConnection();
  }

  private isEmailDisabled(): boolean {
    // Проверяем переменные окружения
    return process.env.DISABLE_EMAILS === 'true';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async verifyConnection(): Promise<void> {
    try {
      const transporter = Reflect.get(this.mailerService, 'transporter') as {
        verify: () => Promise<void>;
      };
      if (!transporter) {
        throw new Error('Mailer transporter is not initialized');
      }

      await transporter.verify();

      console.log('✅ SMTP connection verified');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
    }
  }

  async sendEmail(dto: SendmailDto): Promise<void> {
    // Если отправка отключена - просто логируем и выходим
    if (this.isEmailDisabled()) {
      console.log(`[EMAIL DISABLED] Would send email to: ${dto.to}`);
      console.log(`Subject: ${dto.subject}`);
      console.log(`Text: ${dto.text?.substring(0, 100)}...`);
      return;
    }

    const { maxRetries, delayMs } = this.config.retry;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.mailerService.sendMail({
          to: dto.to,
          subject: dto.subject,
          text: dto.text,
          html: dto.html,
        });

        console.log(`✅ Email sent successfully to: ${dto.to}`);
        return;
      } catch (error) {
        lastError = error;

        console.error(
          `Mail send failed (attempt ${attempt}/${maxRetries})`,
          error,
        );

        if (attempt < maxRetries) {
          await this.sleep(delayMs);
        }
      }
    }

    throw lastError;
  }
}

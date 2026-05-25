import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendmailDto } from './dto/sendmail.dto';
import { sendmailConfig } from '../config/sendmail.config';
import type { TSendmailConfig } from '../config/sendmail.config';

@Injectable()
export class SendmailService implements OnModuleInit {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(sendmailConfig.KEY)
    private readonly config: TSendmailConfig,
  ) {}

  async onModuleInit() {
    await this.verifyConnection();
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

import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { SendmailService } from './sendmail.service';
import { SendmailController } from './sendmail.controller';
import { sendmailConfig, TSendmailConfig } from '../config/sendmail.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(sendmailConfig)],
      inject: [sendmailConfig.KEY],
      useFactory: (config: TSendmailConfig) => ({
        transport: config.transport,
        defaults: config.defaults,
      }),
    }),
  ],
  controllers: [SendmailController],
  providers: [SendmailService],
  exports: [SendmailService]
})

export class SendmailModule {}

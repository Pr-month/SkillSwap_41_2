import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SendmailService } from './sendmail.service';
import { SendmailDto } from './dto/sendmail.dto';
import { ApiSendmail } from './sendmail.swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('sendmail')
@Controller('sendmail')
export class SendmailController {
  constructor(private readonly mailService: SendmailService) {}

  @ApiSendmail()
  @Post('send')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendEmail(@Body() dto: SendmailDto): Promise<void> {
    await this.mailService.sendEmail(dto);
  }
}

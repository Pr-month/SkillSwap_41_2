import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, ValidateIf } from 'class-validator';

export class SendmailDto {
  @ApiProperty({
    description: 'Email получателя',
    example: 'user@example.com',
  })
  @IsEmail()
  to!: string;

  @ApiProperty({
    description: 'Тема письма',
    example: 'Приветствие',
  })
  @IsString()
  @MinLength(1)
  subject!: string;

  @ApiPropertyOptional({
    description: 'Текстовое содержимое письма (если не указан html)',
    example: 'Добрый день!',
  })
  @ValidateIf((o: SendmailDto) => !o.html)
  @IsString()
  @MinLength(1)
  text?: string;

  @ApiPropertyOptional({
    description: 'HTML-содержимое письма (если не указан text)',
    example: '<h1>Добрый день!</h1><p>Сообщение</p>',
  })
  @ValidateIf((o: SendmailDto) => !o.text)
  @IsString()
  @MinLength(1)
  html?: string;
}

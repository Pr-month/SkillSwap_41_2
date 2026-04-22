import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { TRequestWithUser } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDTO: RegisterDTO) {
    return this.authService.register(registerDTO);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: TRequestWithUser) {
    const userId = +req.user.sub;
    const refreshToken = (req as any).refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }
}

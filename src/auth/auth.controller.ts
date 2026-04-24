import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { LoginDTO } from './dto/login.dto';
import { AccessTokenGuard } from './guards/accessToken.guard';
import { Response } from 'express';
import { TLogoutRequest, TRefreshRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDTO: RegisterDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDTO);
    this.authService.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(
    @Req() req: TRefreshRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const result = await this.authService.refreshTokens(userId, refreshToken);
    this.authService.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @Post('login')
  async login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDTO);
    this.authService.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(
    @Req() req: TLogoutRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.logout(req.user.id);
    res.clearCookie('refreshToken', { path: '/auth' });
    return result;
  }
}

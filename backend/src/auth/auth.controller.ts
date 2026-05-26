import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { TRequestWithRefreshToken } from './auth.types';
import { LoginDTO } from './dto/login.dto';
import { Response } from 'express';
import { TLogoutRequest } from './auth.types';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import {
  ApiAuthLogin,
  ApiAuthLogout,
  ApiAuthRefresh,
  ApiAuthRegister,
} from './auth.swagger';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiAuthRegister()
  @Post('register')
  async register(
    @Body() registerDTO: RegisterDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.register(registerDTO);
    this.authService.setRefreshTokenCookie(res, refreshToken);
    return { user, accessToken };
  }

  @ApiAuthRefresh()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @Req() req: TRequestWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(userId, refreshToken);
    this.authService.setRefreshTokenCookie(res, newRefreshToken);
    return { accessToken };
  }

  @ApiAuthLogin()
  @Post('login')
  async login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginDTO);
    this.authService.setRefreshTokenCookie(res, refreshToken);
    return { user, accessToken };
  }

  @ApiAuthLogout()
  @UseGuards(JwtAccessGuard)
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

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { OAuthRequest, TRequestWithRefreshToken } from './auth.types';
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
import { GoogleOAuthGuard } from './guards/google.guard';
import { jwtConfig, TJwtConfig } from 'src/config/jwt.config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: TJwtConfig,
  ) {}

  @ApiAuthRegister()
  @Post('register')
  async register(
    @Body() registerDTO: RegisterDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDTO);
    this.authService.setRefreshTokenCookie(res, result.refreshToken);
    return result;
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
    const result = await this.authService.refreshTokens(userId, refreshToken);
    this.authService.setRefreshTokenCookie(res, result.refreshToken);
    return result;
  }

  @ApiAuthLogin()
  @Post('login')
  async login(
    @Body() loginDTO: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDTO);
    this.authService.setRefreshTokenCookie(res, result.refreshToken);
    return result;
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

  @Get('google/login')
  @UseGuards(GoogleOAuthGuard)
  googleOAuthLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleOAuthCallback(@Req() req: OAuthRequest, @Res() res: Response) {
    console.log('=== google req.user ===', req.user);

    const oauthUser = req.user;
    const oauthData = await this.authService.findOrCreateOAuthUser(oauthUser);
    this.authService.setRefreshTokenCookie(res, oauthData.refreshToken);
    return res.redirect(`${this.jwtCfg.frontendUrl}/oauth/success`);
  }
}

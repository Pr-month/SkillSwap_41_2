import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDTO } from './dto/register.dto';
import { TJwtConfig, jwtConfig } from '../config/jwt.config';
import { StringValue } from 'ms';
import { LoginDTO } from './dto/login.dto';
import { TAuthResponse, TTokens } from './auth.types';
import { OAuthUserDto } from './dto/OAuthUserDto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: TJwtConfig,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  async register(dto: RegisterDTO): Promise<TAuthResponse> {
    //проверяем уникальность емейла
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    //хешируем пароль
    const salt = this.configService.get<number>('app.hashSalt') || 10;
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    //создаем пользователя
    const { birthday, city, ...userData } = dto;
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      birthdate: birthday ? new Date(birthday) : undefined,
      city: city ? { id: Number(city) } : undefined,
      wantToLearn: userData.wantToLearn?.map((id) => ({ id })),
    });

    // сохраняем пользователя в БД
    const savedUser = await this.usersRepository.save(user);
    // генерируем токены
    const tokens = await this.generateTokens(savedUser);

    return {
      user: savedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokens(user: User): Promise<TTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret = this.jwtCfg.accessSecret;
    const refreshSecret = this.jwtCfg.refreshSecret;
    const accessExpires = this.jwtCfg.accessTokenExpires;
    const refreshExpires = this.jwtCfg.refreshTokenExpires;

    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not defined in configuration');
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpires as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpires as StringValue,
    });
    const salt = this.configService.get<number>('app.hashSalt') || 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersRepository.update(user.id, {
      refreshToken: hashedRefreshToken,
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: number, refreshToken: string): Promise<TTokens> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches)
      throw new UnauthorizedException('Invalid refresh token');

    return this.generateTokens(user);
  }

  async login(dto: LoginDTO): Promise<TAuthResponse> {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.password || '',
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    const tokens = await this.generateTokens(user);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: number) {
    await this.usersRepository.update(userId, {
      refreshToken: null,
    });
    return { message: 'Успешный выход' };
  }

  async findOrCreateOAuthUser(data: OAuthUserDto): Promise<TAuthResponse> {
    if (!data.email) {
      throw new BadRequestException('Не удалось получить email пользователя');
    }

    let user = await this.usersRepository.findOne({
      where: { email: data.email },
    });

    if (!user) {
      user = this.usersRepository.create({
        email: data.email,
        name: data.name,
        gender: data.gender,
        avatar: data.avatar,
        provider: data.provider,
      });

      await this.usersRepository.save(user);
    }

    const tokens = await this.generateTokens(user);
    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}

import {
  ConflictException,
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
import { LoginDTO } from './dto/login.dto';
import { TAuthResponse, TTokens } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth',
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
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    //создаем пользователя
    const { password, birthday, wantToLearn, ...userData } = dto;
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      birthdate: birthday ? new Date(birthday) : undefined,
      wantToLearn: wantToLearn?.map((id) => ({ id })),
    });

    // сохраняем пользователя в БД
    const savedUser = await this.usersRepository.save(user);
    // генерируем токены
    const tokens = await this.generateTokens(savedUser);

    //хешируем и сохраняем в бд
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    savedUser.refreshToken = hashedRefreshToken;
    await this.usersRepository.save(savedUser);

    return {
      user: savedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokens(user: User): Promise<TTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.accessTokenSecret'),
      expiresIn: this.configService.get('auth.accessTokenExpiresIn'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.refreshTokenSecret'),
      expiresIn: this.configService.get('auth.refreshTokenExpiresIn'),
    });
    // Хешируем и сохраняем refreshToken в БД
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
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
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
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
    await this.usersRepository.update(userId, { refreshToken: () => 'NULL' });
    return { message: 'Успешный выход' };
  }

}

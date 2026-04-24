import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { RegisterDTO } from './dto/register.dto';
import { TJwtConfig, jwtConfig } from '../config/jwt.config'

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

  async register(dto: RegisterDTO) {
    //хешируем пароль
    const salt = this.configService.get<number>('app.hashSalt') || 10;
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    //создаем пользователя
    const { password, birthday, wantToLearn, ...userData } = dto;
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      birthdate: birthday ? new Date(birthday) : undefined,
      // wantToLearn временно убираем – Category ещё нет
    });

    // сохраняем пользователя в БД
    const savedUser = await this.usersRepository.save(user);
    // генерируем токены
    const tokens = await this.generateTokens(savedUser);

    //формируем ответ
    return {
      user: savedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async generateTokens(user: User) {
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

    const accessToken = this.jwtService.sign(payload as any, {
      secret: accessSecret,
      expiresIn: accessExpires,
    } as any);

    const refreshToken = this.jwtService.sign(payload as any, {
      secret: refreshSecret,
      expiresIn: refreshExpires,
    } as any);
    const salt = this.configService.get<number>('app.hashSalt') || 10;
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersRepository.update(user.id, { refreshToken: hashedRefreshToken });

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: number, refreshToken: string) {
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
}

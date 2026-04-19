import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDTO) {
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
    const user = this.usersRepository.create({
      ...dto,
      password: hashedPassword,
    });

    // сохраняем пользователя в БД
    const savedUser = await this.usersRepository.save(user);
    // генерируем токены
    const tokens = this.generateTokens(savedUser);

    //хешируем и сохраняем в бд
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    savedUser.refreshToken = hashedRefreshToken;
    await this.usersRepository.save(savedUser);

    //формируем ответ
    return {
      user: savedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
  
  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };
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
    await this.usersRepository.update(userId, { refreshToken: hashedRefreshToken });
    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access denied');

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!refreshTokenMatches) throw new UnauthorizedException('Invalid refresh token');

    return this.generateTokens(user.id, user.email, user.role);
  }
}

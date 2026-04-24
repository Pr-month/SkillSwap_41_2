import { User } from '../users/entities/user.entity';
import { Request } from 'express';

type UserBase = Pick<User, 'email' | 'name' | 'role'>;

export type TJwtPayload = UserBase & {
  sub: number;
};

export type TRequestWithUser = Request & {
  user: TJwtPayload;
};

export type TRequestWithRefreshToken = Request & {
  user: TJwtPayload & {
    refreshToken: string;
  };
};
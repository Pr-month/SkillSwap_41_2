import { User } from '../users/entities/user.entity';

type UserBase = Pick<User, 'email' | 'name' | 'role'>;

export type TJwtPayload = UserBase & {
  sub: number;
};

export type TRequestWithUser = Request & {
  user: TJwtPayload;
};

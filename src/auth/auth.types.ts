import { User } from '../users/entities/user.entity';

export type TJwtPayload = Pick<User, 'id' | 'email' | 'name' | 'role'>;

export type TRequestWithUser = Request & {
  user: TJwtPayload;
};
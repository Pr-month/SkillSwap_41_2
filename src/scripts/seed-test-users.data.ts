import { UserRole } from '../users/enums/users.enums';

export interface ISeedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const seedTestUsers: ISeedUser[] = [
  {
    name: 'Ivan Ivanov',
    email: 'ivan@test.local',
    password: 'Password1',
    role: UserRole.USER,
  },
  {
    name: 'Aleksandr Alexandrov',
    email: 'Aleksandr@test.local',
    password: 'Password1',
    role: UserRole.USER,
  },
];

import { UserRole } from '../users/enums/users.enums'

export interface IseedUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const seedTestUsers: IseedUser[] = [
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
  }
]
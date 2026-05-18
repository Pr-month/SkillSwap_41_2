import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/users.enums';

export const Roles = Reflector.createDecorator<UserRole[]>();

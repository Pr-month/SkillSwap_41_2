import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/users.enums';
import { TRequestWithUser } from '../auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.get<UserRole[]>(Roles, context.getHandler()) ??
      this.reflector.get<UserRole[]>(Roles, context.getClass());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request: TRequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Необходима авторизация');
    }

    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }
}

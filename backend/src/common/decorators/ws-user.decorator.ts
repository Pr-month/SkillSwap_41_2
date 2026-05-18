//Для удобного доступа к данным пользователя
//В любом методе шлюза @SubscribeMessage() можно получить данные пользователя через @WsUser() user
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedSocket } from '../../auth/auth.types';
import { TJwtPayload } from '../../auth/auth.types';

export const WsUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TJwtPayload => {
    const client: AuthenticatedSocket = ctx.switchToWs().getClient();
    return client.data.user;
  },
);

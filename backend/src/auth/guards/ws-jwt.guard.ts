import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsAuthService } from '../ws-auth.service';
import { AuthenticatedSocket } from '../auth.types';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private wsAuthService: WsAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthenticatedSocket>();
    const payload = await this.wsAuthService.authenticateSocket(client);
    client.data.user = payload;
    return true;
  }
}

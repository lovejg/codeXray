import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 토큰이 있으면 사용자를 주입하고, 없으면 anonymous 로 통과.
 * 토큰이 있는데 유효하지 않으면 그냥 anonymous 로 취급 (throw 하지 않음).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser = any>(_err: any, user: any): TUser {
    return user ?? null;
  }
}

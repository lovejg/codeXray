import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * 토큰이 있으면 사용자를 주입하고, 없으면 anonymous(null) 로 통과.
 * 토큰이 있는데 유효하지 않아도 throw 하지 않고 anonymous 로 취급한다.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser = AuthUser | null>(_err: unknown, user: unknown): TUser {
    // 인증 실패 시 passport 는 user=false 를 넘기므로 null 로 정규화한다.
    return (user || null) as TUser;
  }
}

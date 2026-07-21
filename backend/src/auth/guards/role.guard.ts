import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';

/** JWT 로 인증된 사용자의 role 이 ADMIN 인지 검사한다. (JwtAuthGuard 뒤에 사용) */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return true;
  }
}

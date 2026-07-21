import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';

/**
 * 데이터 관리 CLI 전용 가드. `X-Admin-Key` 헤더를 .env 의 ADMIN_KEY 와 대조한다.
 * ADMIN_KEY 가 설정돼 있지 않으면(=운영 실수) 무조건 차단해 우회를 막는다.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = process.env.ADMIN_KEY;
    const provided = request.headers['x-admin-key'];

    if (
      !expected ||
      typeof provided !== 'string' ||
      !this.safeEqual(provided, expected)
    ) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return true;
  }

  /** 길이 노출/타이밍 공격을 피하기 위한 상수 시간 비교 */
  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}

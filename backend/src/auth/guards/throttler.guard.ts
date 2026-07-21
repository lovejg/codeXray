import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * 인증 사용자는 user id 로, 비인증 요청은 IP 로 rate limit 을 추적한다.
 * (같은 IP 뒤의 여러 로그인 사용자를 분리해서 카운트)
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request & { user?: AuthUser }): Promise<string> {
    const tracker = req.user?.id
      ? `user-${req.user.id}`
      : (req.ip ?? 'unknown');
    return Promise.resolve(tracker);
  }
}

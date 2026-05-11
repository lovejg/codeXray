import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * 로그인된 사용자는 user.id, 아니면 IP 로 rate limit 트래커 키를 만든다.
 * NAT 뒤 동일 IP 사용자들이 함께 차단되는 가짜 양성을 줄임.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ? `user-${req.user.id}` : (req.ip ?? 'unknown');
  }
}

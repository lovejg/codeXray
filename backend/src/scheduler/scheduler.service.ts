import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { errorMessage } from '../common/error.util';

const TZ = 'Asia/Seoul';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratings: RatingsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ────────────────────────────────────────────────────
  // 1. 주간 티어 재계산 — 매주 일요일 03:00 (KST)
  // ────────────────────────────────────────────────────
  @Cron('0 3 * * 0', { name: 'tier-recompute', timeZone: TZ })
  async recomputeAllTiers() {
    return this.runJob('tier-recompute', async () => {
      const result = await this.ratings.recomputeAll();
      return result;
    });
  }

  // ────────────────────────────────────────────────────
  // 2. 만료 / 사용 완료된 인증 토큰 정리 — 매일 04:00 (KST)
  // ────────────────────────────────────────────────────
  @Cron('0 4 * * *', { name: 'cleanup-tokens', timeZone: TZ })
  async cleanupVerificationTokens() {
    return this.runJob('cleanup-tokens', async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30일 전
      const result = await this.prisma.emailVerificationToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: cutoff } }, // 30일 이상 만료
            { usedAt: { lt: cutoff } }, // 30일 이상 전에 사용됨
          ],
        },
      });
      return { deleted: result.count };
    });
  }

  // ────────────────────────────────────────────────────
  // 3. 오래된 읽은 알림 정리 — 매일 04:30 (KST)
  // ────────────────────────────────────────────────────
  @Cron('30 4 * * *', { name: 'cleanup-notifications', timeZone: TZ })
  async cleanupOldReadNotifications() {
    return this.runJob('cleanup-notifications', async () => {
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60일 전
      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: { lt: cutoff },
        },
      });
      return { deleted: result.count };
    });
  }

  // ────────────────────────────────────────────────────
  // 4. 미해결 건의사항 다이제스트 — 매주 월요일 09:00 (KST)
  // ────────────────────────────────────────────────────
  @Cron('0 9 * * 1', { name: 'stale-suggestion-digest', timeZone: TZ })
  async staleSuggestionDigest() {
    return this.runJob('stale-suggestion-digest', async () => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const stale = await this.prisma.communityPost.findMany({
        where: {
          type: { in: ['FEEDBACK', 'BUG_REPORT', 'FEATURE_REQUEST'] },
          status: null, // 아직 처리 중/해결됨 상태가 아님
          hidden: false,
          createdAt: { lt: cutoff },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, title: true, type: true, createdAt: true },
      });
      if (stale.length === 0) {
        return { count: 0, notified: 0 };
      }
      const oldest = stale[0];
      const oldestDays = Math.floor(
        (Date.now() - oldest.createdAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      const notifiedAdminIds = await this.notifications.createForAllAdmins({
        type: 'STALE_SUGGESTION',
        payload: {
          count: stale.length,
          oldestPostId: oldest.id,
          oldestTitle: oldest.title,
          oldestDays,
        },
      });
      return { count: stale.length, notified: notifiedAdminIds.length };
    });
  }

  // ────────────────────────────────────────────────────
  // 공통: 로깅 + 에러 격리 wrapper
  // 컨트롤러의 수동 트리거에서도 호출 가능하도록 별도 메서드 노출.
  // ────────────────────────────────────────────────────
  async runJob<T>(
    name: string,
    fn: () => Promise<T>,
  ): Promise<{ ok: boolean; result?: T; error?: string }> {
    const startedAt = Date.now();
    this.logger.log(`▶ [${name}] 시작`);
    try {
      const result = await fn();
      const elapsed = Date.now() - startedAt;
      this.logger.log(
        `✓ [${name}] 완료 (${elapsed}ms) ${JSON.stringify(result)}`,
      );
      return { ok: true, result };
    } catch (err) {
      const message = errorMessage(err);
      this.logger.error(
        `✗ [${name}] 실패: ${message}`,
        err instanceof Error ? err.stack : undefined,
      );
      return { ok: false, error: message };
    }
  }
}

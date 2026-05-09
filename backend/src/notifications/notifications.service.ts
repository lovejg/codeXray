import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** 다른 서비스에서 호출. 본인 자기 자신에겐 알림 보내지 않음. */
  async create(params: {
    userId: number | null | undefined;
    type: NotificationType;
    payload: Prisma.InputJsonValue;
    /** 알림 발생 주체. userId 와 같으면 알림 생략 */
    actorId?: number | null;
  }) {
    const { userId, type, payload, actorId } = params;
    if (!userId) return null; // 익명화된 글에 대한 알림 등은 무시
    if (actorId != null && actorId === userId) return null; // 자기 자신
    return this.prisma.notification.create({
      data: { userId, type, payload },
    });
  }

  /** 모든 ADMIN 유저에게 broadcast (관리자 알림용) */
  async createForAllAdmins(params: {
    type: NotificationType;
    payload: Prisma.InputJsonValue;
    excludeUserId?: number;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    const targets = admins.filter((a) => a.id !== params.excludeUserId);
    if (targets.length === 0) return [];
    await this.prisma.notification.createMany({
      data: targets.map((t) => ({
        userId: t.id,
        type: params.type,
        payload: params.payload,
      })),
    });
    return targets.map((t) => t.id);
  }

  async list(userId: number, opts: { onlyUnread?: boolean; limit?: number; cursor?: number }) {
    const limit = Math.min(opts.limit ?? 20, 50);
    return this.prisma.notification.findMany({
      where: { userId, ...(opts.onlyUnread ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });
  }

  async unreadCount(userId: number) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAllRead(userId: number) {
    const now = new Date();
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: now },
    });
    return { ok: true };
  }

  async markRead(userId: number, ids: number[]) {
    if (ids.length === 0) return { ok: true };
    await this.prisma.notification.updateMany({
      where: { id: { in: ids }, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { ok: true };
  }

  async deleteOne(userId: number, id: number) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { ok: true };
  }
}

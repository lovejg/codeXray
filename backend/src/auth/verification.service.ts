import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import type { UserRole } from '@prisma/client';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h
const RESEND_COOLDOWN_MS = 1000 * 60; // 1분

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private buildLink(token: string) {
    const base = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return `${base}/verify-email?token=${token}`;
  }

  async issueAndSend(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    if (user.emailVerified) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }

    const recent = await this.prisma.emailVerificationToken.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (
      recent &&
      Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      throw new BadRequestException('잠시 후 다시 시도해주세요.');
    }

    // 기존 미사용 토큰 전부 무효화
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    await this.mail.sendVerificationEmail(
      user.email,
      user.nickname,
      this.buildLink(token),
    );
  }

  async verify(
    token: string,
  ): Promise<{ userId: number; email: string; role: UserRole }> {
    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record) throw new BadRequestException('유효하지 않은 토큰입니다.');
    if (record.usedAt) throw new BadRequestException('이미 사용된 토큰입니다.');
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        '만료된 토큰입니다. 인증 메일을 재전송해주세요.',
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const shouldBeAdmin = adminEmail && record.user.email === adminEmail;

    const [, updated] = await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          emailVerified: true,
          ...(shouldBeAdmin && record.user.role !== 'ADMIN'
            ? { role: 'ADMIN' }
            : {}),
        },
      }),
    ]);

    return { userId: updated.id, email: updated.email, role: updated.role };
  }
}

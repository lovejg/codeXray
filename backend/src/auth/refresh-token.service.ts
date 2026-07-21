import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/** refresh token 유효기간 (30일) */
const REFRESH_TTL_MS = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** raw 토큰은 저장하지 않고 SHA-256 해시만 DB 에 보관한다. */
  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /** 새 로그인 세션(family)으로 refresh token 발급 → raw 토큰 반환 */
  async issue(userId: number): Promise<string> {
    return this.createInFamily(userId, randomUUID());
  }

  /**
   * 로테이션: 유효한 토큰이면 폐기 후 같은 family 로 새 토큰을 발급한다.
   * 이미 폐기된 토큰이 다시 들어오면 탈취로 간주하고 family 전체를 폐기한다.
   */
  async rotate(raw: string): Promise<{ userId: number; refreshToken: string }> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(raw) },
    });
    if (!record) {
      throw new UnauthorizedException('유효하지 않은 refresh token 입니다.');
    }
    if (record.revokedAt) {
      // 폐기된 토큰 재사용 = 탈취 의심 → 세션(family) 전체 무효화
      await this.revokeFamily(record.family);
      throw new UnauthorizedException(
        '세션이 만료되었습니다. 다시 로그인해주세요.',
      );
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('refresh token 이 만료되었습니다.');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    const refreshToken = await this.createInFamily(
      record.userId,
      record.family,
    );
    return { userId: record.userId, refreshToken };
  }

  /** 로그아웃: 해당 토큰이 속한 세션(family) 전체를 폐기한다. */
  async revoke(raw: string): Promise<void> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(raw) },
    });
    if (record) await this.revokeFamily(record.family);
  }

  private async createInFamily(
    userId: number,
    family: string,
  ): Promise<string> {
    const raw = randomBytes(40).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hash(raw),
        userId,
        family,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });
    return raw;
  }

  private async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

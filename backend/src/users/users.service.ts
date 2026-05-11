import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import type { AuthProvider, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /**
   * 비밀번호 기반 회원가입 (LOCAL provider).
   * emailVerified=false 로 생성. ADMIN 승격은 이메일 인증 완료 시점에 결정.
   */
  async createLocal(email: string, password: string, nickname: string) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      // 기존 레코드가 미인증 LOCAL 이면 덮어쓰기 (선점 공격 방어)
      if (existingEmail.provider === 'LOCAL' && !existingEmail.emailVerified) {
        await this.prisma.user.delete({ where: { id: existingEmail.id } });
      } else {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    const existingNick = await this.prisma.user.findUnique({ where: { nickname } });
    if (existingNick) throw new ConflictException('이미 사용 중인 닉네임입니다.');

    const hashed = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashed,
        nickname,
        provider: 'LOCAL',
        emailVerified: false,
        // role 은 기본 USER. 인증 완료 시 VerificationService 에서 ADMIN 승격.
      },
      select: {
        id: true, email: true, nickname: true, role: true,
        emailVerified: true, provider: true, createdAt: true,
      },
    });
  }

  /**
   * OAuth 가입/로그인. provider 가 email_verified=true 를 보장한다는 전제.
   * 같은 이메일의 LOCAL 미인증 유저가 있으면 삭제 후 OAuth 유저 생성 (선점 방어).
   */
  async findOrCreateOAuth(params: {
    provider: AuthProvider;
    providerId: string;
    email: string;
    displayName: string;
  }): Promise<User> {
    const { provider, providerId, email, displayName } = params;

    // 1) provider+providerId 로 이미 있으면 반환
    const byProvider = await this.prisma.user.findFirst({
      where: { provider, providerId },
    });
    if (byProvider) return byProvider;

    // 2) 동일 이메일 LOCAL 유저 처리
    const sameEmail = await this.prisma.user.findUnique({ where: { email } });
    if (sameEmail) {
      if (sameEmail.provider === 'LOCAL' && !sameEmail.emailVerified) {
        await this.prisma.user.delete({ where: { id: sameEmail.id } });
      } else {
        // 인증된 LOCAL 유저가 있으면 충돌 — 사용자가 기존 계정으로 로그인해야 함
        throw new ConflictException(
          '이미 동일한 이메일로 비밀번호 가입된 계정이 있습니다. 비밀번호로 로그인해주세요.',
        );
      }
    }

    // 3) 닉네임 생성 (충돌 시 숫자 suffix)
    const nickname = await this.makeUniqueNickname(displayName);

    const adminEmail = process.env.ADMIN_EMAIL;
    const role = adminEmail && email === adminEmail ? 'ADMIN' : 'USER';

    return this.prisma.user.create({
      data: {
        email,
        nickname,
        provider,
        providerId,
        emailVerified: true, // OAuth 는 provider 가 이미 검증
        role,
      },
    });
  }

  private async makeUniqueNickname(base: string): Promise<string> {
    const clean = base.replace(/\s+/g, '').slice(0, 18) || 'user';
    for (let i = 0; i < 20; i++) {
      const candidate = i === 0 ? clean : `${clean}${i + 1}`;
      const exists = await this.prisma.user.findUnique({ where: { nickname: candidate } });
      if (!exists) return candidate;
    }
    return `${clean}${Date.now()}`;
  }

  async setRole(id: number, role: 'USER' | 'ADMIN') {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  /** 비밀번호 변경 — LOCAL 계정만. 현재 비밀번호 검증 후 새 해시 저장. */
  async changePassword(id: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    if (user.provider !== 'LOCAL' || !user.password) {
      throw new ForbiddenException(
        `${user.provider} 계정은 해당 provider 에서 비밀번호를 변경해야 합니다.`,
      );
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');
    if (currentPassword === newPassword) {
      throw new BadRequestException('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashed } });
    return { message: '비밀번호가 변경되었습니다.' };
  }

  /**
   * 회원 탈퇴 — 모든 관련 데이터는 onDelete: Cascade 로 함께 삭제.
   * LOCAL: 비밀번호 검증 / OAuth: 닉네임 입력 검증.
   */
  async deleteAccount(
    id: number,
    opts: { password?: string; confirmNickname?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    if (user.provider === 'LOCAL') {
      if (!opts.password || !user.password) {
        throw new BadRequestException('비밀번호 입력이 필요합니다.');
      }
      const valid = await bcrypt.compare(opts.password, user.password);
      if (!valid) throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    } else {
      if (!opts.confirmNickname || opts.confirmNickname !== user.nickname) {
        throw new BadRequestException('닉네임이 일치하지 않습니다.');
      }
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }

  /** 타인에게 노출 가능한 공개 통계: 풀이 수 + 티어 패밀리 + 알고리즘 태그 분포 */
  async getPublicStats(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, nickname: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    const solutions = await this.prisma.solution.findMany({
      where: { userId: id },
      select: {
        problem: {
          select: {
            tier: true,
            tags: { include: { tag: true } },
          },
        },
      },
    });

    const solveCount = solutions.length;

    // 티어 패밀리 집계
    const familyCount: Record<string, number> = {};
    for (const s of solutions) {
      if (!s.problem?.tier) continue;
      const fam = String(s.problem.tier).split('_')[0];
      familyCount[fam] = (familyCount[fam] ?? 0) + 1;
    }
    let mainTierFamily: string | null = null;
    let max = 0;
    for (const [fam, cnt] of Object.entries(familyCount)) {
      if (cnt > max) {
        max = cnt;
        mainTierFamily = fam;
      }
    }

    // 알고리즘 태그 분포
    const tagCount: Record<string, number> = {};
    for (const s of solutions) {
      for (const t of s.problem?.tags ?? []) {
        const name = t.tag?.name;
        if (!name) continue;
        tagCount[name] = (tagCount[name] ?? 0) + 1;
      }
    }

    return {
      id: user.id,
      nickname: user.nickname,
      createdAt: user.createdAt,
      solveCount,
      mainTierFamily,
      tierFamilyCounts: familyCount,
      algorithmTagCounts: tagCount,
    };
  }

  async getProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, nickname: true, role: true,
        emailVerified: true, provider: true, createdAt: true,
        _count: { select: { solutions: true, notes: true } },
      },
    });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return user;
  }
}

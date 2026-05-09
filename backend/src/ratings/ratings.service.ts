import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeAdjustedLevel, levelToTier } from './ratings.util';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── 피드백 CRUD ─────────────────────────────────────────
  async submitFeedback(userId: number, problemId: number, level: number) {
    if (level < 0 || level > 5 || !Number.isInteger(level)) {
      throw new Error('level은 0~5 사이의 정수여야 합니다.');
    }
    const feedback = await this.prisma.levelFeedback.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: { level },
      create: { userId, problemId, level },
    });
    // 즉시 이 문제의 adjustedLevel/tier 갱신
    await this.recomputeProblem(problemId);
    return feedback;
  }

  async getMyFeedback(userId: number, problemId: number) {
    const feedback = await this.prisma.levelFeedback.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });
    return { feedback };
  }

  // ─── 단일 문제 재계산 ────────────────────────────────────
  async recomputeProblem(problemId: number) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      include: { levelFeedbacks: { select: { level: true } } },
    });
    if (!problem) return null;

    const adjusted = computeAdjustedLevel({
      origLevel: problem.level,
      acceptanceRate: problem.acceptanceRate,
      feedbackLevels: problem.levelFeedbacks.map((f) => f.level),
    });
    const tier = levelToTier(adjusted);

    return this.prisma.problem.update({
      where: { id: problemId },
      data: { adjustedLevel: adjusted, tier },
    });
  }

  // ─── 전체 재계산 (배치용) ──────────────────────────────
  async recomputeAll() {
    const problems = await this.prisma.problem.findMany({
      include: { levelFeedbacks: { select: { level: true } } },
    });

    this.logger.log(`전체 ${problems.length}개 문제 티어 재계산 시작`);

    // 트랜잭션으로 배치 업데이트
    const updates = problems.map((p) => {
      const adjusted = computeAdjustedLevel({
        origLevel: p.level,
        acceptanceRate: p.acceptanceRate,
        feedbackLevels: p.levelFeedbacks.map((f) => f.level),
      });
      return this.prisma.problem.update({
        where: { id: p.id },
        data: { adjustedLevel: adjusted, tier: levelToTier(adjusted) },
      });
    });

    await this.prisma.$transaction(updates);
    this.logger.log(`티어 재계산 완료`);
    return { count: problems.length };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSolutionDto, UpdateSolutionDto, UpsertMemoDto } from './dto/solution.dto';

const TIER_FAMILIES = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as const;

@Injectable()
export class SolutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // 내 풀이 목록 (별표 필터 포함)
  async findMyAll(userId: number, starred?: boolean) {
    return this.prisma.solution.findMany({
      where: { userId, ...(starred !== undefined && { starred }) },
      include: {
        problem: { include: { tags: { include: { tag: true } } } },
        memo: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // 특정 풀이 조회
  async findOne(id: number, userId: number) {
    const solution = await this.prisma.solution.findUnique({
      where: { id },
      include: {
        problem: { include: { tags: { include: { tag: true } } } },
        memo: true,
      },
    });
    if (!solution) throw new NotFoundException('풀이를 찾을 수 없습니다.');
    if (solution.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다.');
    return solution;
  }

  // 풀이 등록
  async create(userId: number, dto: CreateSolutionDto) {
    // 새 등록인지 판단 (upsert 전 조회)
    const existing = await this.prisma.solution.findUnique({
      where: { userId_problemId: { userId, problemId: dto.problemId } },
    });

    const solution = await this.prisma.solution.upsert({
      where: { userId_problemId: { userId, problemId: dto.problemId } },
      update: { code: dto.code, language: dto.language ?? 'python' },
      create: { userId, problemId: dto.problemId, code: dto.code, language: dto.language ?? 'python' },
      include: { problem: true, memo: true },
    });

    // 신규 등록이고 문제에 티어가 있으면 첫 해당 패밀리 풀이인지 검사
    if (!existing && solution.problem.tier) {
      const family = String(solution.problem.tier).split('_')[0];
      if ((TIER_FAMILIES as readonly string[]).includes(family)) {
        const priorCount = await this.prisma.solution.count({
          where: {
            userId,
            problemId: { not: dto.problemId },
            problem: { tier: { startsWith: family + '_' } as any },
          },
        });
        if (priorCount === 0) {
          await this.notifications.create({
            userId,
            type: 'TIER_UP',
            payload: {
              family,
              problemId: solution.problem.id,
              problemTitle: solution.problem.title,
            },
          });
        }
      }
    }

    return solution;
  }

  // 풀이 수정
  async update(id: number, userId: number, dto: UpdateSolutionDto) {
    await this.findOne(id, userId);
    return this.prisma.solution.update({
      where: { id },
      data: dto,
      include: { problem: true, memo: true },
    });
  }

  // 별표 토글
  async toggleStar(id: number, userId: number) {
    const solution = await this.findOne(id, userId);
    return this.prisma.solution.update({
      where: { id },
      data: { starred: !solution.starred },
    });
  }

  // 메모 저장 (upsert)
  async upsertMemo(solutionId: number, userId: number, dto: UpsertMemoDto) {
    await this.findOne(solutionId, userId); // 소유권 확인
    return this.prisma.memo.upsert({
      where: { solutionId },
      update: dto,
      create: { solutionId, ...dto },
    });
  }

  // 풀이 삭제
  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.solution.delete({ where: { id } });
  }
}

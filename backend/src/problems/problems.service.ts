import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto, UpdateProblemDto, ProblemFilterDto } from './dto/problem.dto';
import { TIER_ORDER } from '../ratings/ratings.util';

@Injectable()
export class ProblemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ProblemFilterDto) {
    const {
      search, source, tierMin, tierMax, tagId,
      sortBy = 'createdAt', order = 'desc',
      page = 1, pageSize = 50,
    } = filter;

    // 티어 범위가 지정되면 해당 구간의 티어들만 필터. 기본 전체 범위면 생략.
    const tierFilter =
      tierMin !== undefined || tierMax !== undefined
        ? {
            tier: {
              in: TIER_ORDER.slice(tierMin ?? 0, (tierMax ?? TIER_ORDER.length - 1) + 1),
            },
          }
        : {};

    const where = {
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
      ...(source && { source }),
      ...tierFilter,
      ...(tagId && { tags: { some: { tagId } } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.problem.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: { select: { solutions: true } },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.problem.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const problem = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { solutions: true, communityPosts: true } },
      },
    });
    if (!problem) throw new NotFoundException('문제를 찾을 수 없습니다.');
    return problem;
  }

  async create(dto: CreateProblemDto) {
    const { tagIds, ...data } = dto;
    return this.prisma.problem.create({
      data: {
        ...data,
        tags: tagIds?.length
          ? { create: tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });
  }

  async update(id: number, dto: UpdateProblemDto) {
    await this.findOne(id);
    const { tagIds, ...data } = dto;

    return this.prisma.problem.update({
      where: { id },
      data: {
        ...data,
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.problem.delete({ where: { id } });
  }
}

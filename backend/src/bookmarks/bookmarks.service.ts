import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.bookmarkedProblem.findMany({
      where: { userId },
      include: {
        problem: {
          include: { tags: { include: { tag: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: number, problemId: number) {
    const existing = await this.prisma.bookmarkedProblem.findUnique({
      where: { userId_problemId: { userId, problemId } },
    });

    if (existing) {
      await this.prisma.bookmarkedProblem.delete({
        where: { userId_problemId: { userId, problemId } },
      });
      return { bookmarked: false };
    } else {
      await this.prisma.bookmarkedProblem.create({
        data: { userId, problemId },
      });
      return { bookmarked: true };
    }
  }

  async getBookmarkedIds(userId: number): Promise<number[]> {
    const rows = await this.prisma.bookmarkedProblem.findMany({
      where: { userId },
      select: { problemId: true },
    });
    return rows.map((r) => r.problemId);
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.algorithmTag.findMany({
      include: { _count: { select: { problems: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    const existing = await this.prisma.algorithmTag.findUnique({
      where: { name },
    });
    if (existing) throw new ConflictException('이미 존재하는 태그입니다.');
    return this.prisma.algorithmTag.create({ data: { name } });
  }

  async remove(id: number) {
    const tag = await this.prisma.algorithmTag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('태그를 찾을 수 없습니다.');
    return this.prisma.algorithmTag.delete({ where: { id } });
  }
}

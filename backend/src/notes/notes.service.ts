import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto, NoteFilterDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  findMyAll(userId: number, filter: NoteFilterDto) {
    const { type, search } = filter;
    return this.prisma.note.findMany({
      where: {
        userId,
        ...(type && { type }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { body: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('노트를 찾을 수 없습니다.');
    if (note.userId !== userId)
      throw new ForbiddenException('접근 권한이 없습니다.');
    return note;
  }

  create(userId: number, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: { userId, ...dto, tags: dto.tags ?? [] },
    });
  }

  async update(id: number, userId: number, dto: UpdateNoteDto) {
    await this.findOne(id, userId);
    return this.prisma.note.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.note.delete({ where: { id } });
  }
}

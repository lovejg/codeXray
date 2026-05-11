import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, NoteFilterDto } from './dto/note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notes')
@ApiBearerAuth('jwt')
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({
    summary: '내 노트 목록',
    description: '타입(CODE/PATTERN/MISTAKE/OTHER) / 검색어 / 태그로 필터.',
  })
  findMyAll(@Req() req: any, @Query() filter: NoteFilterDto) {
    return this.notesService.findMyAll(req.user.id, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: '노트 단건 조회' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: '노트 등록' })
  create(@Req() req: any, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '노트 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '노트 삭제' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.notesService.remove(id, req.user.id);
  }
}

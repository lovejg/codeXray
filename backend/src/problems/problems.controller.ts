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
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto, UpdateProblemDto, ProblemFilterDto } from './dto/problem.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  // 누구나 조회 가능
  @Get()
  findAll(@Query() filter: ProblemFilterDto) {
    return this.problemsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.problemsService.findOne(id);
  }

  // 관리자만 문제 추가/수정/삭제 (X-Admin-Key 헤더 필요)
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateProblemDto) {
    return this.problemsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProblemDto) {
    return this.problemsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.problemsService.remove(id);
  }
}

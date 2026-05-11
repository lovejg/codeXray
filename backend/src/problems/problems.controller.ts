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
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ProblemsService } from './problems.service';
import { CreateProblemDto, UpdateProblemDto, ProblemFilterDto } from './dto/problem.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Problems')
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  @ApiOperation({
    summary: '문제 목록 조회',
    description: '검색어 / 출처 / 티어 범위 / 알고리즘 태그 / 페이지네이션 지원. 인증 불필요.',
  })
  findAll(@Query() filter: ProblemFilterDto) {
    return this.problemsService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: '문제 상세 조회', description: '태그 + 정답률 + 티어 포함.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.problemsService.findOne(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiSecurity('adminKey')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 문제 등록' })
  create(@Body() dto: CreateProblemDto) {
    return this.problemsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiSecurity('adminKey')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 문제 수정' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProblemDto) {
    return this.problemsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiSecurity('adminKey')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 문제 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.problemsService.remove(id);
  }
}

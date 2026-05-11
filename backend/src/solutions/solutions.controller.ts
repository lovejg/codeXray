import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SolutionsService } from './solutions.service';
import { CreateSolutionDto, UpdateSolutionDto, UpsertMemoDto } from './dto/solution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Solutions')
@ApiBearerAuth('jwt')
@Controller('solutions')
@UseGuards(JwtAuthGuard)
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get()
  @ApiOperation({
    summary: '내 풀이 목록',
    description: '`?starred=true` 로 다시 풀어야 할 문제만 필터 가능.',
  })
  findMyAll(@Req() req: any, @Query('starred') starred?: string) {
    const starredBool = starred === 'true' ? true : starred === 'false' ? false : undefined;
    return this.solutionsService.findMyAll(req.user.id, starredBool);
  }

  @Get(':id')
  @ApiOperation({ summary: '내 풀이 단건 조회 (메모 포함)' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.solutionsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({
    summary: '풀이 등록 (upsert)',
    description: '같은 문제에 이미 등록된 풀이가 있으면 코드/언어 갱신. 첫 풀이라면 TIER_UP 알림 가능.',
  })
  create(@Req() req: any, @Body() dto: CreateSolutionDto) {
    return this.solutionsService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '풀이 수정' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateSolutionDto,
  ) {
    return this.solutionsService.update(id, req.user.id, dto);
  }

  @Patch(':id/star')
  @ApiOperation({ summary: '"다시 풀어야 할 문제" 토글' })
  toggleStar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.solutionsService.toggleStar(id, req.user.id);
  }

  @Put(':id/memo')
  @ApiOperation({
    summary: '풀이 메모 upsert',
    description: '왜 틀렸는지 / 풀이 논리 / 핵심 함수 / 자유 메모 4가지 카테고리.',
  })
  upsertMemo(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpsertMemoDto,
  ) {
    return this.solutionsService.upsertMemo(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '풀이 삭제' })
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.solutionsService.remove(id, req.user.id);
  }
}

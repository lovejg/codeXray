import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { IsInt, Min, Max } from 'class-validator';

class SubmitFeedbackDto {
  @IsInt()
  @Min(0)
  @Max(5)
  level: number;
}

@ApiTags('Ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('feedback/:problemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: '난이도 피드백 제출',
    description:
      '0~5 레벨로 체감 난이도 신고. 베이지안 shrinkage 로 해당 문제 `adjustedLevel` + `tier` 자동 재계산.',
  })
  submitFeedback(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Req() req: any,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.ratingsService.submitFeedback(req.user.id, problemId, dto.level);
  }

  @Get('feedback/:problemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '특정 문제에 대한 내 피드백 조회' })
  getMyFeedback(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Req() req: any,
  ) {
    return this.ratingsService.getMyFeedback(req.user.id, problemId);
  }

  @Post('recompute-all')
  @UseGuards(AdminGuard)
  @ApiSecurity('adminKey')
  @ApiTags('Admin')
  @ApiOperation({
    summary: '[Admin] 전체 티어 재계산',
    description: '모든 문제의 adjustedLevel/tier 를 재계산. 주간 배치로 수동 트리거 (X-Admin-Key 필요).',
  })
  recomputeAll() {
    return this.ratingsService.recomputeAll();
  }
}

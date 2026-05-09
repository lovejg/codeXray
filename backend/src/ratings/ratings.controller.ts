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

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // 사용자 피드백 제출 (로그인 필요)
  @Post('feedback/:problemId')
  @UseGuards(JwtAuthGuard)
  submitFeedback(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Req() req: any,
    @Body() dto: SubmitFeedbackDto,
  ) {
    return this.ratingsService.submitFeedback(req.user.id, problemId, dto.level);
  }

  // 내 피드백 조회
  @Get('feedback/:problemId')
  @UseGuards(JwtAuthGuard)
  getMyFeedback(
    @Param('problemId', ParseIntPipe) problemId: number,
    @Req() req: any,
  ) {
    return this.ratingsService.getMyFeedback(req.user.id, problemId);
  }

  // 전체 티어 재계산 (관리자 전용 — 주간 배치 수동 트리거)
  @Post('recompute-all')
  @UseGuards(AdminGuard)
  recomputeAll() {
    return this.ratingsService.recomputeAll();
  }
}

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiAnalyzeDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@ApiBearerAuth('jwt')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @Throttle({ default: { ttl: 24 * 60 * 60 * 1000, limit: 2 } }) // 1일 2회 (Claude API 비용)
  @ApiOperation({
    summary: '풀이 분석 (Claude)',
    description:
      '`task=explain` 또는 `task=optimize`. claude-sonnet-4-6 으로 코드 분석 결과 마크다운 반환. **사용자당 1일 2회 제한** (비용 통제).',
  })
  analyze(@Body() dto: AiAnalyzeDto) {
    return this.aiService.analyze(dto);
  }
}

import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../auth/guards/role.guard';
import { SchedulerService } from './scheduler.service';

@ApiTags('Admin')
@ApiBearerAuth('jwt')
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminJobsController {
  constructor(private readonly scheduler: SchedulerService) {}

  @Post('tier-recompute')
  @ApiOperation({
    summary: '[Admin] 티어 재계산 즉시 실행',
    description: '예정된 주간 cron 을 기다리지 않고 지금 바로 트리거.',
  })
  tierRecompute() {
    return this.scheduler.recomputeAllTiers();
  }

  @Post('cleanup-tokens')
  @ApiOperation({ summary: '[Admin] 만료 인증 토큰 정리 즉시 실행' })
  cleanupTokens() {
    return this.scheduler.cleanupVerificationTokens();
  }

  @Post('cleanup-notifications')
  @ApiOperation({ summary: '[Admin] 오래된 읽은 알림 정리 즉시 실행' })
  cleanupNotifications() {
    return this.scheduler.cleanupOldReadNotifications();
  }

  @Post('stale-suggestion-digest')
  @ApiOperation({ summary: '[Admin] 미처리 건의사항 다이제스트 즉시 실행' })
  staleSuggestionDigest() {
    return this.scheduler.staleSuggestionDigest();
  }
}

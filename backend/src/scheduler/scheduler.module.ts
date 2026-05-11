import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { AdminJobsController } from './admin-jobs.controller';
import { RatingsModule } from '../ratings/ratings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [RatingsModule, NotificationsModule],
  controllers: [AdminJobsController],
  providers: [SchedulerService],
})
export class SchedulerModule {}

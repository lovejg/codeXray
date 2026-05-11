import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProblemsModule } from './problems/problems.module';
import { TagsModule } from './tags/tags.module';
import { SolutionsModule } from './solutions/solutions.module';
import { NotesModule } from './notes/notes.module';
import { CommunityModule } from './community/community.module';
import { AiModule } from './ai/ai.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { RatingsModule } from './ratings/ratings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AppThrottlerGuard } from './auth/guards/throttler.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // 전역 기본: 1분에 100회. 엔드포인트별로 @Throttle 로 override.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProblemsModule,
    TagsModule,
    SolutionsModule,
    NotesModule,
    CommunityModule,
    AiModule,
    BookmarksModule,
    RatingsModule,
    NotificationsModule,
    SchedulerModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
  ],
})
export class AppModule {}

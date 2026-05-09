import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}

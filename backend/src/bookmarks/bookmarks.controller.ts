import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  // 내 북마크 목록 (문제 상세 포함)
  @Get()
  findAll(@Req() req: any) {
    return this.bookmarksService.findAll(req.user.id);
  }

  // 북마크한 problemId 목록만 (목록 페이지 별표 표시용)
  @Get('ids')
  getIds(@Req() req: any) {
    return this.bookmarksService.getBookmarkedIds(req.user.id);
  }

  // 북마크 토글 (없으면 추가, 있으면 제거)
  @Post(':problemId')
  toggle(@Param('problemId', ParseIntPipe) problemId: number, @Req() req: any) {
    return this.bookmarksService.toggle(req.user.id, problemId);
  }
}

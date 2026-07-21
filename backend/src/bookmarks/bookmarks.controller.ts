import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';

@ApiTags('Bookmarks')
@ApiBearerAuth('jwt')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  @ApiOperation({ summary: '내 북마크 목록 (문제 상세 포함)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.bookmarksService.findAll(user.id);
  }

  @Get('ids')
  @ApiOperation({
    summary: '북마크한 problemId 배열',
    description: '문제 목록 페이지의 별 표시용 가벼운 응답.',
  })
  getIds(@CurrentUser() user: AuthUser) {
    return this.bookmarksService.getBookmarkedIds(user.id);
  }

  @Post(':problemId')
  @ApiOperation({ summary: '북마크 토글 (없으면 추가, 있으면 제거)' })
  toggle(
    @Param('problemId', ParseIntPipe) problemId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.bookmarksService.toggle(user.id, problemId);
  }
}

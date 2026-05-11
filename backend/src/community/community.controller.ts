import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import {
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateStatusDto,
  UpdateAdminReplyDto,
  VotePostDto,
  CreateReportDto,
  UpdateReportDto,
  HidePostDto,
} from './dto/community.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AdminRoleGuard } from '../auth/guards/role.guard';
import { PostType, ReportStatus, SuggestionStatus } from '@prisma/client';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '게시글 목록',
    description:
      '`type` / `types` (CSV) / `problemId` / `status` / `sort=recent|votes` / `authorId` 필터. 비공개·숨김 글은 작성자/관리자만 조회 가능.',
  })
  findAll(
    @Req() req: any,
    @Query('type') type?: PostType,
    @Query('types') types?: string,
    @Query('problemId') problemId?: string,
    @Query('status') status?: SuggestionStatus,
    @Query('sort') sort?: 'recent' | 'votes',
    @Query('authorId') authorId?: string,
  ) {
    const typeList: PostType[] = types
      ? (types.split(',').filter(Boolean) as PostType[])
      : type
        ? [type]
        : [];
    return this.communityService.findAllPosts(req.user, {
      types: typeList,
      problemId: problemId ? +problemId : undefined,
      status,
      sort,
      authorId: authorId ? +authorId : undefined,
    });
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '게시글 상세 조회 (댓글 + 추천 점수 포함)' })
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.findOnePost(id, req.user);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } }) // 1분에 5회 (글 도배 방지)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '게시글 등록' })
  createPost(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.id, dto);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '게시글 수정 (작성자 본인만)' })
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdatePostDto,
  ) {
    return this.communityService.updatePost(id, req.user, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '게시글 삭제 (작성자 또는 관리자)' })
  deletePost(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.deletePost(id, req.user);
  }

  @Patch('posts/:id/status')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('jwt')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 건의사항 상태 변경 (IN_PROGRESS / RESOLVED)' })
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.communityService.updateStatus(id, dto);
  }

  @Patch('posts/:id/admin-reply')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('jwt')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 관리자 공식 답변 등록/수정 (빈 문자열 → 제거)' })
  updateAdminReply(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminReplyDto) {
    return this.communityService.updateAdminReply(id, dto);
  }

  // ─── 투표 ───────────────────────────────────────────
  @Post('posts/:id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: '게시글 추천/비추천',
    description: 'value=1 추천 / -1 비추천. QUESTION/SOLUTION_SHARE 만 허용. 본인 글 차단.',
  })
  vote(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: VotePostDto,
  ) {
    return this.communityService.vote(id, req.user.id, dto);
  }

  @Delete('posts/:id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '내 투표 철회' })
  removeVote(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.removeVote(id, req.user.id);
  }

  // ─── 신고 ───────────────────────────────────────────
  @Post('posts/:id/report')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60 * 60 * 1000, limit: 10 } }) // 1시간에 10회 (신고 abuse 방지)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '게시글 신고 (사유 필수, 같은 글 중복 신고 불가)' })
  report(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.communityService.report(id, req.user.id, dto);
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('jwt')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 신고 목록 (?status= 필터)' })
  listReports(@Query('status') status?: ReportStatus) {
    return this.communityService.listReports(status);
  }

  @Patch('admin/reports/:id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('jwt')
  @ApiTags('Admin')
  @ApiOperation({ summary: '[Admin] 신고 상태 변경 (HANDLED / DISMISSED)' })
  updateReport(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReportDto) {
    return this.communityService.updateReport(id, dto);
  }

  @Patch('admin/posts/:id/hide')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('jwt')
  @ApiTags('Admin')
  @ApiOperation({
    summary: '[Admin] 게시글 숨김 토글',
    description: 'hidden=true 로 만들면 해당 게시글의 OPEN 신고들이 자동 HANDLED 로 일괄 처리.',
  })
  hidePost(@Param('id', ParseIntPipe) id: number, @Body() dto: HidePostDto) {
    return this.communityService.setHidden(id, dto.hidden);
  }

  // ─── 댓글 ───────────────────────────────────────────
  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 20 } }) // 1분에 20회
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '댓글 작성 (작성자에게 알림)' })
  createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.createComment(postId, req.user.id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '댓글 삭제 (작성자 또는 관리자)' })
  deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.deleteComment(id, req.user);
  }
}

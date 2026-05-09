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

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Req() req: any,
    @Query('type') type?: PostType,
    @Query('types') types?: string,
    @Query('problemId') problemId?: string,
    @Query('status') status?: SuggestionStatus,
    @Query('sort') sort?: 'recent' | 'votes',
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
    });
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.findOnePost(id, req.user);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(req.user.id, dto);
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdatePostDto,
  ) {
    return this.communityService.updatePost(id, req.user, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.deletePost(id, req.user);
  }

  @Patch('posts/:id/status')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.communityService.updateStatus(id, dto);
  }

  @Patch('posts/:id/admin-reply')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  updateAdminReply(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminReplyDto) {
    return this.communityService.updateAdminReply(id, dto);
  }

  // ─── 투표 ───────────────────────────────────────────
  @Post('posts/:id/vote')
  @UseGuards(JwtAuthGuard)
  vote(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: VotePostDto,
  ) {
    return this.communityService.vote(id, req.user.id, dto);
  }

  @Delete('posts/:id/vote')
  @UseGuards(JwtAuthGuard)
  removeVote(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.removeVote(id, req.user.id);
  }

  // ─── 신고 ───────────────────────────────────────────
  @Post('posts/:id/report')
  @UseGuards(JwtAuthGuard)
  report(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.communityService.report(id, req.user.id, dto);
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  listReports(@Query('status') status?: ReportStatus) {
    return this.communityService.listReports(status);
  }

  @Patch('admin/reports/:id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  updateReport(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReportDto) {
    return this.communityService.updateReport(id, dto);
  }

  @Patch('admin/posts/:id/hide')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  hidePost(@Param('id', ParseIntPipe) id: number, @Body() dto: HidePostDto) {
    return this.communityService.setHidden(id, dto.hidden);
  }

  // ─── 댓글 ───────────────────────────────────────────
  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id', ParseIntPipe) postId: number,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.createComment(postId, req.user.id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.communityService.deleteComment(id, req.user);
  }
}

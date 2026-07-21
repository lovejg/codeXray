import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateStatusDto,
  UpdateAdminReplyDto,
  VotePostDto,
  CreateReportDto,
  UpdateReportDto,
} from './dto/community.dto';
import {
  PostReport,
  PostType,
  Prisma,
  ReportStatus,
  SuggestionStatus,
} from '@prisma/client';
import { type AuthUser } from '../auth/decorators/current-user.decorator';

const SUGGESTION_TYPES: PostType[] = [
  'FEEDBACK',
  'BUG_REPORT',
  'FEATURE_REQUEST',
];
const VOTABLE_TYPES: PostType[] = ['QUESTION', 'SOLUTION_SHARE'];

// 탈퇴한 사용자의 글/댓글이 user: null 로 떨어지면 표시용으로 정규화
const ANONYMOUS_USER = { id: 0, nickname: '탈퇴한 사용자' };

function isSuggestion(type: PostType) {
  return SUGGESTION_TYPES.includes(type);
}

function withAnonymousUser<T extends Record<string, unknown>>(obj: T): T {
  return { ...obj, user: obj.user ?? ANONYMOUS_USER };
}

type RequestUser = AuthUser | null;

type SortKey = 'recent' | 'votes';

/** enrichPosts 가 각 게시글에 덧붙이는 투표 집계 필드 */
type VoteAggregate = {
  upvotes: number;
  downvotes: number;
  score: number;
  myVote: number;
};

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** 비공개 + 숨김 글을 현재 사용자가 볼 수 있는지 필터 */
  private visibilityWhere(user: RequestUser): Prisma.CommunityPostWhereInput {
    if (user?.role === 'ADMIN') return {};
    if (user?.id) {
      return {
        AND: [
          { OR: [{ isPrivate: false }, { userId: user.id }] },
          { OR: [{ hidden: false }, { userId: user.id }] },
        ],
      };
    }
    return { isPrivate: false, hidden: false };
  }

  private async enrichPosts<T extends { id: number }>(
    posts: T[],
    userId: number | undefined,
  ): Promise<Array<T & VoteAggregate>> {
    const ids = posts.map((p) => p.id);
    if (ids.length === 0) return [];

    // 투표 집계
    const voteAgg = await this.prisma.postVote.groupBy({
      by: ['postId', 'value'],
      where: { postId: { in: ids } },
      _count: true,
    });
    const upMap = new Map<number, number>();
    const downMap = new Map<number, number>();
    for (const row of voteAgg) {
      if (row.value === 1) upMap.set(row.postId, row._count);
      else if (row.value === -1) downMap.set(row.postId, row._count);
    }

    // 내 투표
    const myVotes = userId
      ? await this.prisma.postVote.findMany({
          where: { userId, postId: { in: ids } },
          select: { postId: true, value: true },
        })
      : [];
    const myMap = new Map(myVotes.map((v) => [v.postId, v.value]));

    return posts.map((p) => ({
      ...p,
      upvotes: upMap.get(p.id) ?? 0,
      downvotes: downMap.get(p.id) ?? 0,
      score: (upMap.get(p.id) ?? 0) - (downMap.get(p.id) ?? 0),
      myVote: myMap.get(p.id) ?? 0,
    }));
  }

  async findAllPosts(
    user: RequestUser,
    opts: {
      types?: PostType[];
      problemId?: number;
      status?: SuggestionStatus;
      sort?: SortKey;
      authorId?: number;
    },
  ) {
    const { types, problemId, status, sort = 'recent', authorId } = opts;
    const posts = await this.prisma.communityPost.findMany({
      where: {
        AND: [
          this.visibilityWhere(user),
          types && types.length > 0 ? { type: { in: types } } : {},
          problemId ? { problemId } : {},
          status ? { status } : {},
          authorId ? { userId: authorId } : {},
        ],
      },
      include: {
        user: { select: { id: true, nickname: true } },
        problem: { select: { id: true, title: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await this.enrichPosts(posts, user?.id);
    if (sort === 'votes') {
      enriched.sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return enriched.map(withAnonymousUser);
  }

  async findOnePost(id: number, user: RequestUser) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nickname: true } },
        problem: { select: { id: true, title: true } },
        comments: {
          include: { user: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    const isOwner = post.userId === user?.id;
    const isAdmin = user?.role === 'ADMIN';
    if (post.isPrivate && !isOwner && !isAdmin) {
      throw new ForbiddenException('비공개 게시글입니다.');
    }
    if (post.hidden && !isOwner && !isAdmin) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }
    const [enriched] = await this.enrichPosts([post], user?.id);
    // 본문 + 댓글 작성자 모두 정규화 (탈퇴 사용자 표시용)
    return {
      ...withAnonymousUser(enriched),
      comments: enriched.comments.map(withAnonymousUser),
    };
  }

  createPost(userId: number, dto: CreatePostDto) {
    return this.prisma.communityPost.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        problemId: dto.problemId,
        isPrivate: dto.isPrivate ?? false,
      },
      include: { user: { select: { id: true, nickname: true } } },
    });
  }

  async updatePost(id: number, user: RequestUser, dto: UpdatePostDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.userId !== user?.id)
      throw new ForbiddenException('수정 권한이 없습니다.');
    return this.prisma.communityPost.update({ where: { id }, data: dto });
  }

  async deletePost(id: number, user: RequestUser) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    const isOwner = post.userId === user?.id;
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin)
      throw new ForbiddenException('삭제 권한이 없습니다.');
    return this.prisma.communityPost.delete({ where: { id } });
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (!isSuggestion(post.type)) {
      throw new ForbiddenException(
        '건의사항 글에서만 상태를 변경할 수 있습니다.',
      );
    }
    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: { status: dto.status },
    });

    // 상태가 실제로 바뀌었을 때만 알림
    if (post.status !== dto.status) {
      await this.notifications.create({
        userId: post.userId,
        type: 'STATUS_CHANGE',
        payload: {
          postId: post.id,
          postTitle: post.title,
          oldStatus: post.status,
          newStatus: dto.status,
        },
      });
    }

    return updated;
  }

  async updateAdminReply(id: number, dto: UpdateAdminReplyDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (!isSuggestion(post.type)) {
      throw new ForbiddenException(
        '건의사항 글에서만 관리자 답변을 달 수 있습니다.',
      );
    }
    const reply = dto.adminReply.trim();
    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        adminReply: reply || null,
        adminReplyAt: reply ? new Date() : null,
      },
    });

    // 답변이 등록되었거나 수정되었을 때만 알림 (제거는 알림 안 함)
    if (reply) {
      await this.notifications.create({
        userId: post.userId,
        type: 'ADMIN_REPLY',
        payload: {
          postId: post.id,
          postTitle: post.title,
          replyPreview: reply.slice(0, 80),
        },
      });
    }

    return updated;
  }

  async createComment(postId: number, userId: number, dto: CreateCommentDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.isPrivate && post.userId !== userId) {
      throw new ForbiddenException('비공개 게시글에는 댓글을 달 수 없습니다.');
    }
    if (post.hidden) {
      throw new ForbiddenException('숨겨진 게시글에는 댓글을 달 수 없습니다.');
    }
    const comment = await this.prisma.comment.create({
      data: { postId, userId, content: dto.content },
      include: { user: { select: { id: true, nickname: true } } },
    });

    // 게시글 작성자에게 알림 (자기 자신은 제외)
    await this.notifications.create({
      userId: post.userId,
      actorId: userId,
      type: 'COMMENT',
      payload: {
        postId: post.id,
        postTitle: post.title,
        postType: post.type,
        commenterNickname: comment.user?.nickname ?? '사용자',
        contentPreview: dto.content.slice(0, 80),
      },
    });

    return comment;
  }

  async deleteComment(id: number, user: RequestUser) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    const isOwner = comment.userId === user?.id;
    const isAdmin = user?.role === 'ADMIN';
    if (!isOwner && !isAdmin)
      throw new ForbiddenException('삭제 권한이 없습니다.');
    return this.prisma.comment.delete({ where: { id } });
  }

  // ─── 투표 ────────────────────────────────────────────
  async vote(postId: number, userId: number, dto: VotePostDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (!VOTABLE_TYPES.includes(post.type)) {
      throw new BadRequestException('이 글에는 추천/비추천을 할 수 없습니다.');
    }
    if (post.userId === userId) {
      throw new BadRequestException('본인 글에는 투표할 수 없습니다.');
    }
    if (post.hidden) {
      throw new ForbiddenException('숨겨진 게시글에는 투표할 수 없습니다.');
    }
    await this.prisma.postVote.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, value: dto.value },
      update: { value: dto.value },
    });
    return this.voteSummary(postId, userId);
  }

  async removeVote(postId: number, userId: number) {
    await this.prisma.postVote
      .delete({ where: { userId_postId: { userId, postId } } })
      .catch(() => null); // 이미 없으면 무시
    return this.voteSummary(postId, userId);
  }

  private async voteSummary(postId: number, userId: number) {
    const votes = await this.prisma.postVote.groupBy({
      by: ['value'],
      where: { postId },
      _count: true,
    });
    let up = 0,
      down = 0;
    for (const v of votes) {
      if (v.value === 1) up = v._count;
      else if (v.value === -1) down = v._count;
    }
    const mine = await this.prisma.postVote.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return {
      upvotes: up,
      downvotes: down,
      score: up - down,
      myVote: mine?.value ?? 0,
    };
  }

  // ─── 신고 ────────────────────────────────────────────
  async report(postId: number, userId: number, dto: CreateReportDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (post.userId === userId) {
      throw new BadRequestException('본인 글은 신고할 수 없습니다.');
    }
    let created: PostReport;
    try {
      created = await this.prisma.postReport.create({
        data: { postId, userId, reason: dto.reason },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('이미 신고한 게시글입니다.');
      }
      throw e;
    }

    // 모든 관리자에게 알림 (신고자 본인이 관리자라면 제외)
    await this.notifications.createForAllAdmins({
      type: 'NEW_REPORT',
      payload: {
        reportId: created.id,
        postId: post.id,
        postTitle: post.title,
        reason: dto.reason,
      },
      excludeUserId: userId,
    });

    return created;
  }

  async listReports(status?: ReportStatus) {
    return this.prisma.postReport.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, nickname: true } },
        post: {
          select: {
            id: true,
            title: true,
            type: true,
            hidden: true,
            userId: true,
            user: { select: { id: true, nickname: true } },
            _count: { select: { reports: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateReport(id: number, dto: UpdateReportDto) {
    const report = await this.prisma.postReport.findUnique({
      where: { id },
      include: { post: { select: { id: true, title: true } } },
    });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');
    const updated = await this.prisma.postReport.update({
      where: { id },
      data: { status: dto.status, adminNote: dto.adminNote ?? null },
    });

    // 상태가 실제로 종결되었을 때 신고자에게 알림 (OPEN → HANDLED/DISMISSED)
    if (
      report.status !== dto.status &&
      (dto.status === 'HANDLED' || dto.status === 'DISMISSED')
    ) {
      await this.notifications.create({
        userId: report.userId,
        type: 'REPORT_RESOLVED',
        payload: {
          postId: report.postId,
          postTitle: report.post.title,
          resolution: dto.status,
          adminNote: dto.adminNote ?? null,
        },
      });
    }

    return updated;
  }

  // ─── 숨김 ────────────────────────────────────────────
  async setHidden(postId: number, hidden: boolean) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    // 숨길 때만 관련 신고들을 자동으로 HANDLED 로 일괄 처리
    // (해제 시엔 자동 되돌리지 않음 — 운영자가 다시 판단)
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.communityPost.update({
        where: { id: postId },
        data: { hidden },
      });
      let resolvedReporters: number[] = [];
      if (hidden) {
        // 알림 발송용으로 영향받는 신고자 미리 조회
        const open = await tx.postReport.findMany({
          where: { postId, status: 'OPEN' },
          select: { userId: true },
        });
        resolvedReporters = open.map((r) => r.userId);
        await tx.postReport.updateMany({
          where: { postId, status: 'OPEN' },
          data: { status: 'HANDLED' },
        });
      }
      return { updated, resolvedReporters };
    });

    if (hidden) {
      // 작성자에게 숨김 알림
      await this.notifications.create({
        userId: post.userId,
        type: 'POST_HIDDEN',
        payload: {
          postId: post.id,
          postTitle: post.title,
          postType: post.type,
        },
      });
      // 신고자들에게 처리 완료 알림 (중복 제거)
      const uniqueReporters = Array.from(new Set(result.resolvedReporters));
      for (const reporterId of uniqueReporters) {
        await this.notifications.create({
          userId: reporterId,
          type: 'REPORT_RESOLVED',
          payload: {
            postId: post.id,
            postTitle: post.title,
            resolution: 'HANDLED',
            autoResolved: true,
          },
        });
      }
    }

    return result.updated;
  }
}

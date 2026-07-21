import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const makePrismaMock = () => ({
  communityPost: {
    findUnique: jest.fn(),
  },
  postVote: {
    groupBy: jest.fn().mockResolvedValue([]),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
  },
});

describe('CommunityService', () => {
  let service: CommunityService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const notifications = {
      create: jest.fn(),
      createForAllAdmins: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = module.get(CommunityService);
  });

  describe('findOnePost — 가시성 검증', () => {
    const basePost = {
      id: 1,
      userId: 99,
      title: '테스트 글',
      content: '본문',
      type: 'QUESTION',
      isPrivate: false,
      hidden: false,
      user: { id: 99, nickname: '작성자' },
      problem: null,
      comments: [],
      createdAt: new Date(),
    };

    it('비공개 글 — 작성자/관리자 외엔 ForbiddenException', async () => {
      prisma.communityPost.findUnique.mockResolvedValue({
        ...basePost,
        isPrivate: true,
      });
      await expect(service.findOnePost(1, { id: 42 })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('비공개 글 — 작성자 본인은 조회 가능', async () => {
      prisma.communityPost.findUnique.mockResolvedValue({
        ...basePost,
        isPrivate: true,
      });
      const result = await service.findOnePost(1, { id: 99 });
      expect(result.id).toBe(1);
    });

    it('비공개 글 — 관리자는 조회 가능', async () => {
      prisma.communityPost.findUnique.mockResolvedValue({
        ...basePost,
        isPrivate: true,
      });
      const result = await service.findOnePost(1, { id: 5, role: 'ADMIN' });
      expect(result.id).toBe(1);
    });

    it('숨김 글 — 외부인은 NotFoundException (게시글 자체 존재를 노출하지 않음)', async () => {
      prisma.communityPost.findUnique.mockResolvedValue({
        ...basePost,
        hidden: true,
      });
      await expect(service.findOnePost(1, { id: 42 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('익명화 — 탈퇴한 사용자', () => {
    it('post.user 가 null 이면 sentinel "탈퇴한 사용자" 로 정규화', async () => {
      prisma.communityPost.findUnique.mockResolvedValue({
        id: 1,
        userId: null,
        type: 'QUESTION',
        title: '글',
        content: '본문',
        isPrivate: false,
        hidden: false,
        user: null, // ← 작성자 탈퇴
        problem: null,
        comments: [
          {
            id: 10,
            userId: null,
            user: null,
            content: '댓글',
            createdAt: new Date(),
          },
          {
            id: 11,
            userId: 7,
            user: { id: 7, nickname: '살아있는 사용자' },
            content: '댓글2',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
      });
      const result = await service.findOnePost(1, undefined);
      expect(result.user).toEqual({ id: 0, nickname: '탈퇴한 사용자' });
      // 댓글도 동일하게 정규화
      expect(result.comments[0].user).toEqual({
        id: 0,
        nickname: '탈퇴한 사용자',
      });
      // 살아있는 사용자는 그대로
      expect(result.comments[1].user).toEqual({
        id: 7,
        nickname: '살아있는 사용자',
      });
    });
  });
});

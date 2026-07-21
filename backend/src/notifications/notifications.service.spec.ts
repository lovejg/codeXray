import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const makePrismaMock = () => ({
  notification: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  user: {
    findMany: jest.fn(),
  },
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  describe('create — 자기 자신 / 익명 처리 skip', () => {
    it('userId 가 null 이면 알림 생성 안 함 (탈퇴한 사용자 글에 단 댓글 등)', async () => {
      const result = await service.create({
        userId: null,
        type: 'COMMENT',
        payload: {},
      });
      expect(result).toBeNull();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('actorId === userId 면 알림 생성 안 함 (본인이 본인 글에 댓글 단 경우)', async () => {
      const result = await service.create({
        userId: 42,
        actorId: 42,
        type: 'COMMENT',
        payload: {},
      });
      expect(result).toBeNull();
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('정상 케이스 — actor 와 userId 가 다르면 생성', async () => {
      await service.create({
        userId: 42,
        actorId: 10,
        type: 'COMMENT',
        payload: { foo: 'bar' },
      });
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: 42, type: 'COMMENT', payload: { foo: 'bar' } },
      });
    });
  });

  describe('createForAllAdmins — broadcast', () => {
    it('excludeUserId 와 일치하는 ADMIN 은 발송 대상에서 제외', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const ids = await service.createForAllAdmins({
        type: 'NEW_REPORT',
        payload: { test: true },
        excludeUserId: 2,
      });

      expect(ids).toEqual([1, 3]);
      expect(prisma.notification.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 1, type: 'NEW_REPORT', payload: { test: true } },
          { userId: 3, type: 'NEW_REPORT', payload: { test: true } },
        ],
      });
    });

    it('관리자가 0명이면 빈 배열 반환 + createMany 호출 안 함', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      const ids = await service.createForAllAdmins({
        type: 'NEW_REPORT',
        payload: {},
      });
      expect(ids).toEqual([]);
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });
});

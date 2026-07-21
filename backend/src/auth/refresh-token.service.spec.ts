import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';

const makePrismaMock = () => ({
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
});

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();
    const module = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(RefreshTokenService);
  });

  describe('issue', () => {
    it('새 토큰을 생성하고 raw 값을 반환한다 (DB 엔 해시만 저장)', async () => {
      const raw = await service.issue(1);
      expect(typeof raw).toBe('string');
      expect(raw.length).toBeGreaterThan(0);
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
      const [createArg] = prisma.refreshToken.create.mock.calls[0] as [
        { data: { tokenHash: string; userId: number } },
      ];
      // 저장되는 값은 raw 가 아니라 해시여야 한다
      expect(createArg.data.tokenHash).not.toBe(raw);
      expect(createArg.data.userId).toBe(1);
    });
  });

  describe('rotate', () => {
    it('유효한 토큰이면 기존 토큰을 폐기하고 같은 family 로 새 토큰을 발급한다', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 7,
        family: 'fam-1',
        expiresAt: future(),
        revokedAt: null,
      });

      const result = await service.rotate('valid-raw');

      expect(result.userId).toBe(7);
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken).not.toBe('valid-raw');
      // 기존 토큰 폐기
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { revokedAt: expect.any(Date) as Date },
      });
      // 같은 family 로 새 토큰 생성
      const [createArg] = prisma.refreshToken.create.mock.calls[0] as [
        { data: { family: string } },
      ];
      expect(createArg.data.family).toBe('fam-1');
    });

    it('이미 폐기된 토큰이 재사용되면 family 전체를 폐기하고 거부한다 (reuse detection)', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 7,
        family: 'fam-1',
        expiresAt: future(),
        revokedAt: past(), // 이미 폐기됨
      });

      await expect(service.rotate('stolen-raw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { family: 'fam-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) as Date },
      });
      // 새 토큰은 발급하지 않음
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('만료된 토큰은 거부한다', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 7,
        family: 'fam-1',
        expiresAt: past(),
        revokedAt: null,
      });
      await expect(service.rotate('expired-raw')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.create).not.toHaveBeenCalled();
    });

    it('존재하지 않는 토큰은 거부한다', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.rotate('unknown')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('revoke (logout)', () => {
    it('토큰이 속한 family 전체를 폐기한다', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'r1',
        userId: 7,
        family: 'fam-1',
        expiresAt: future(),
        revokedAt: null,
      });
      await service.revoke('some-raw');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { family: 'fam-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) as Date },
      });
    });

    it('알 수 없는 토큰이면 조용히 무시한다', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await service.revoke('unknown');
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});

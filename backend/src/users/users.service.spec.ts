import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService.deleteAccount', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('LOCAL provider', () => {
    const localUser = {
      id: 1,
      provider: 'LOCAL',
      password: '', // 아래 beforeEach 에서 채움
      nickname: 'tester',
      email: 'test@example.com',
    };

    beforeEach(async () => {
      localUser.password = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue(localUser);
    });

    it('비밀번호 누락 → BadRequestException', async () => {
      await expect(service.deleteAccount(1, {})).rejects.toThrow(BadRequestException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('비밀번호 틀림 → UnauthorizedException', async () => {
      await expect(
        service.deleteAccount(1, { password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('비밀번호 정확 → 삭제 진행', async () => {
      await service.deleteAccount(1, { password: 'correct-password' });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('OAuth provider (NAVER)', () => {
    const oauthUser = {
      id: 2,
      provider: 'NAVER',
      password: null,
      nickname: 'naverUser',
      email: 'naver@example.com',
    };

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(oauthUser);
    });

    it('confirmNickname 누락 → BadRequestException', async () => {
      await expect(service.deleteAccount(2, {})).rejects.toThrow(BadRequestException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('confirmNickname 불일치 → BadRequestException', async () => {
      await expect(
        service.deleteAccount(2, { confirmNickname: 'wrongName' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('confirmNickname 일치 → 삭제 진행', async () => {
      await service.deleteAccount(2, { confirmNickname: 'naverUser' });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });
  });
});

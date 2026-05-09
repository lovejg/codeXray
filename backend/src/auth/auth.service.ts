import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { VerificationService } from './verification.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import type { GoogleProfilePayload } from './strategies/google.strategy';
import type { NaverProfilePayload } from './strategies/naver.strategy';
import type { AuthProvider, User, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly verification: VerificationService,
  ) {}

  private signTokenFor(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      emailVerified: user.emailVerified,
      provider: user.provider,
    };
  }

  async register(dto: RegisterDto) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && dto.email === adminEmail) {
      // ADMIN_EMAIL 은 OAuth 전용으로 예약: 비밀번호 가입 차단
      throw new ForbiddenException(
        '이 이메일은 Google 로그인으로만 가입할 수 있습니다.',
      );
    }

    const created = await this.usersService.createLocal(
      dto.email,
      dto.password,
      dto.nickname,
    );
    await this.verification.issueAndSend(created.id);
    return {
      message: '가입이 완료되었습니다. 이메일로 전송된 인증 링크를 클릭해주세요.',
      email: created.email,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    if (user.provider !== 'LOCAL') {
      throw new UnauthorizedException(
        `이 계정은 ${user.provider} 로그인으로 가입되었습니다.`,
      );
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    if (!user.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: '이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.',
        email: user.email,
      });
    }

    return {
      accessToken: this.signTokenFor(user),
      user: this.publicUser(user),
    };
  }

  async verifyEmail(token: string) {
    const result = await this.verification.verify(token);
    const user = await this.usersService.findById(result.userId);
    return {
      accessToken: this.signTokenFor(user),
      user: this.publicUser(user),
    };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    // 이메일 존재 여부를 유출하지 않도록 성공 응답 통일
    if (!user || user.emailVerified || user.provider !== 'LOCAL') {
      return { message: '메일 발송 요청을 처리했습니다.' };
    }
    try {
      await this.verification.issueAndSend(user.id);
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw err;
    }
    return { message: '메일 발송 요청을 처리했습니다.' };
  }

  async handleGoogleLogin(profile: GoogleProfilePayload) {
    return this.handleOAuthLogin('GOOGLE', profile);
  }

  async handleNaverLogin(profile: NaverProfilePayload) {
    return this.handleOAuthLogin('NAVER', profile);
  }

  private async handleOAuthLogin(
    provider: AuthProvider,
    profile: { providerId: string; email: string; displayName: string },
  ) {
    const user = await this.usersService.findOrCreateOAuth({
      provider,
      providerId: profile.providerId,
      email: profile.email,
      displayName: profile.displayName,
    });

    // OAuth 로그인 시마다 ADMIN_EMAIL 일치하면 승격 (role 이 USER 로 남아있던 경우 보정)
    const adminEmail = process.env.ADMIN_EMAIL;
    let finalRole: UserRole = user.role;
    if (adminEmail && user.email === adminEmail && user.role !== 'ADMIN') {
      await this.usersService.setRole(user.id, 'ADMIN');
      finalRole = 'ADMIN';
    }

    return {
      accessToken: this.signTokenFor({ id: user.id, email: user.email, role: finalRole }),
      user: this.publicUser({ ...user, role: finalRole }),
    };
  }
}

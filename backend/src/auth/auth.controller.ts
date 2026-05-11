import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto/auth.dto';
import type { GoogleProfilePayload } from './strategies/google.strategy';
import type { NaverProfilePayload } from './strategies/naver.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60 * 60 * 1000, limit: 5 } }) // 1시간에 5회
  @ApiOperation({
    summary: '비밀번호 회원가입',
    description:
      '`emailVerified=false` 로 계정 생성 후 인증 토큰을 메일로 발송. 응답으로 입력 이메일을 반환.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // 1분에 10회 (brute force 방어)
  @ApiOperation({
    summary: '비밀번호 로그인',
    description:
      'LOCAL provider 만 허용. 미인증 계정은 `403 EMAIL_NOT_VERIFIED` 반환 (프론트가 재전송 UI 표시).',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: '이메일 인증',
    description: '메일 링크로 받은 토큰을 검증하고 `emailVerified=true` + JWT 발급.',
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @Throttle({ default: { ttl: 60_000, limit: 1 } }) // 1분에 1회 (메일 비용 + 서비스 자체 1분 쿨다운과 일치)
  @ApiOperation({
    summary: '인증 메일 재전송',
    description: '미인증 LOCAL 계정에 새 토큰 발급 + 메일 발송. 1분 쿨다운.',
  })
  resend(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth 시작',
    description: '브라우저에서 직접 진입. Passport 가 Google 로 리다이렉트.',
  })
  googleStart() {
    // Passport 가 Google 로 리다이렉트
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth 콜백',
    description:
      'Google 인증 완료 후 자동 호출. JWT 발급 후 프론트엔드 `/oauth/callback` 로 리다이렉트.',
  })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    await this.oauthCallback(res, () =>
      this.authService.handleGoogleLogin(req.user as GoogleProfilePayload),
    );
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: 'Naver OAuth 시작' })
  naverStart() {
    // Passport 가 Naver 로 리다이렉트
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
  @ApiOperation({ summary: 'Naver OAuth 콜백' })
  async naverCallback(@Req() req: Request, @Res() res: Response) {
    await this.oauthCallback(res, () =>
      this.authService.handleNaverLogin(req.user as NaverProfilePayload),
    );
  }

  private async oauthCallback(
    res: Response,
    handler: () => Promise<{ accessToken: string; user: unknown }>,
  ) {
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    try {
      const result = await handler();
      const params = new URLSearchParams({
        token: result.accessToken,
        user: JSON.stringify(result.user),
      });
      res.redirect(`${frontend}/oauth/callback?${params.toString()}`);
    } catch (err: any) {
      const msg = err?.response?.message ?? err?.message ?? 'OAuth 로그인 실패';
      const params = new URLSearchParams({ error: String(msg) });
      res.redirect(`${frontend}/oauth/callback?${params.toString()}`);
    }
  }
}

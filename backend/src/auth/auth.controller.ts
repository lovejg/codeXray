import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  resend(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleStart() {
    // Passport 가 Google 로 리다이렉트
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    await this.oauthCallback(res, () =>
      this.authService.handleGoogleLogin(req.user as GoogleProfilePayload),
    );
  }

  @Get('naver')
  @UseGuards(AuthGuard('naver'))
  naverStart() {
    // Passport 가 Naver 로 리다이렉트
  }

  @Get('naver/callback')
  @UseGuards(AuthGuard('naver'))
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

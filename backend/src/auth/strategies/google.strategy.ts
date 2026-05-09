import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, type Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

export interface GoogleProfilePayload {
  providerId: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? 'missing',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? 'missing',
      callbackURL:
        config.get<string>('GOOGLE_CALLBACK_URL') ??
        'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;
    // Google 은 OIDC id_token 의 email_verified 클레임을 profile._json 에 담아줌
    const json = (profile as any)._json as { email_verified?: boolean } | undefined;
    const emailVerified =
      json?.email_verified === true ||
      (profile.emails?.[0] as any)?.verified === true;

    if (!email) {
      return done(new UnauthorizedException('Google 계정에서 이메일을 가져오지 못했습니다.'));
    }
    if (!emailVerified) {
      return done(new UnauthorizedException('Google 계정 이메일이 인증되지 않았습니다.'));
    }

    const payload: GoogleProfilePayload = {
      providerId: profile.id,
      email,
      emailVerified,
      displayName: profile.displayName ?? email.split('@')[0],
    };
    done(null, payload);
  }
}

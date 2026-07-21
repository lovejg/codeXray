import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';

export interface NaverProfilePayload {
  providerId: string;
  email: string;
  displayName: string;
}

type VerifyDone = (error: Error | null, user?: NaverProfilePayload) => void;

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('NAVER_CLIENT_ID') ?? 'missing',
      clientSecret: config.get<string>('NAVER_CLIENT_SECRET') ?? 'missing',
      callbackURL:
        config.get<string>('NAVER_CALLBACK_URL') ??
        'http://localhost:3000/api/auth/naver/callback',
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyDone,
  ) {
    if (!profile.email) {
      return done(
        new UnauthorizedException(
          '네이버 계정에서 이메일 권한이 허용되지 않았습니다.',
        ),
      );
    }
    const payload: NaverProfilePayload = {
      providerId: profile.id,
      email: profile.email,
      displayName:
        profile.nickname ?? profile.name ?? profile.email.split('@')[0],
    };
    done(null, payload);
  }
}

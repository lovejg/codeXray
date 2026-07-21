import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';

/** JwtStrategy.validate() 가 req.user 로 주입하는 인증 사용자. */
export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

/**
 * 인증된 사용자를 컨트롤러 파라미터로 주입한다.
 * - `JwtAuthGuard` 하위: 항상 `AuthUser` 로 받는다.
 * - `OptionalJwtAuthGuard` 하위: 미인증 요청은 `null` 이므로 `AuthUser | null` 로 받는다.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    return request.user ?? null;
  },
);

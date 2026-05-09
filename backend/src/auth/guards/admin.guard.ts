import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['x-admin-key'];

    if (adminKey !== process.env.ADMIN_KEY) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
    return true;
  }
}

import { HttpException } from '@nestjs/common';

/**
 * `unknown` 으로 잡힌 에러에서 사람이 읽을 메시지를 안전하게 추출한다.
 * NestJS HttpException / 표준 Error / 그 외를 모두 처리한다.
 */
export function errorMessage(
  err: unknown,
  fallback = '알 수 없는 오류',
): string {
  if (err instanceof HttpException) {
    const res = err.getResponse();
    if (typeof res === 'string') return res;
    if (res && typeof res === 'object' && 'message' in res) {
      const message = (res as { message: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.join(', ');
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

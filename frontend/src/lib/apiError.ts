import { AxiosError } from 'axios'

/** 백엔드가 내려주는 에러 응답 형태 (NestJS 예외 필터 기준) */
export interface ApiErrorData {
  message?: string | { code?: string; email?: string }
  code?: string
  email?: string
  [key: string]: unknown
}

/** axios 에러에서 백엔드 에러 페이로드(response.data)를 안전하게 추출한다. */
export function getApiErrorData(err: unknown): ApiErrorData | undefined {
  if (err instanceof AxiosError) {
    return (err.response?.data as ApiErrorData | undefined) ?? undefined
  }
  return undefined
}

/** 백엔드 에러 메시지를 추출하고, 없으면 fallback 문구를 반환한다. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const message = getApiErrorData(err)?.message
  return typeof message === 'string' ? message : fallback
}

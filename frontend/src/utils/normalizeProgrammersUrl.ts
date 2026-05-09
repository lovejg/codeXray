/**
 * 프로그래머스 문제 URL 을 표준 형태로 변환.
 * 매칭 비교용 — query string / trailing slash / fragment 제거.
 * 프로그래머스 도메인이 아니면 null.
 */
export function normalizeProgrammersUrl(input: string): string | null {
  if (!input) return null
  try {
    const u = new URL(input.trim())
    if (!u.hostname.endsWith('programmers.co.kr')) return null
    const path = u.pathname.replace(/\/+$/, '')
    return `${u.origin}${path}`
  } catch {
    return null
  }
}

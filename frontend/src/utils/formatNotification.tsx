import {
  MessageSquare,
  ShieldCheck,
  Megaphone,
  EyeOff,
  Flag,
  TrendingUp,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Notification, NotificationType } from '../types'
import { STATUS_LABEL } from '../types'
import { familyLabel, type TierFamily } from '../components/common/TierBadge'

export interface FormattedNotification {
  icon: ReactNode
  title: string
  body: string
  link: string
  color: string // 아이콘 색상
}

const ICON_SIZE = 14

function isSuggestionType(t: string) {
  return t === 'FEEDBACK' || t === 'BUG_REPORT' || t === 'FEATURE_REQUEST'
}

function postLink(postId: number, postType?: string) {
  if (postType && isSuggestionType(postType)) return `/suggestions/${postId}`
  return `/community/${postId}`
}

export function formatNotification(n: Notification): FormattedNotification {
  const p = n.payload ?? {}

  switch (n.type) {
    case 'COMMENT':
      return {
        icon: <MessageSquare size={ICON_SIZE} />,
        color: '#60a5fa',
        title: '새 댓글',
        body: `${p.commenterNickname ?? '사용자'} 님이 "${p.postTitle}" 에 댓글을 달았습니다`,
        link: postLink(p.postId, p.postType),
      }
    case 'ADMIN_REPLY':
      return {
        icon: <ShieldCheck size={ICON_SIZE} />,
        color: '#10b981',
        title: '관리자 답변',
        body: `"${p.postTitle}" 에 관리자가 답변했습니다`,
        link: `/suggestions/${p.postId}`,
      }
    case 'STATUS_CHANGE': {
      const newLabel = p.newStatus ? STATUS_LABEL[p.newStatus as keyof typeof STATUS_LABEL] ?? p.newStatus : '변경'
      return {
        icon: <Megaphone size={ICON_SIZE} />,
        color: '#f59e0b',
        title: '건의사항 상태 변경',
        body: `"${p.postTitle}" 이 ${newLabel} 로 변경되었습니다`,
        link: `/suggestions/${p.postId}`,
      }
    }
    case 'POST_HIDDEN':
      return {
        icon: <EyeOff size={ICON_SIZE} />,
        color: '#fca5a5',
        title: '게시글 숨김 처리',
        body: `"${p.postTitle}" 이 관리자에 의해 숨김 처리되었습니다`,
        link: postLink(p.postId, p.postType),
      }
    case 'REPORT_RESOLVED': {
      const resolution = p.resolution === 'DISMISSED' ? '기각' : '처리 완료'
      const auto = p.autoResolved ? ' (게시글이 숨김 처리됨)' : ''
      return {
        icon: <Flag size={ICON_SIZE} />,
        color: '#10b981',
        title: '신고 처리 결과',
        body: `"${p.postTitle}" 신고가 ${resolution}${auto}`,
        link: postLink(p.postId),
      }
    }
    case 'NEW_REPORT':
      return {
        icon: <Flag size={ICON_SIZE} />,
        color: '#ef4444',
        title: '새 신고 접수',
        body: `"${p.postTitle}" 에 신고가 접수되었습니다`,
        link: '/admin/reports',
      }
    case 'TIER_UP': {
      const fam = p.family as TierFamily | undefined
      const label = fam ? familyLabel(fam) : '신규'
      return {
        icon: <TrendingUp size={ICON_SIZE} />,
        color: '#c4b5fd',
        title: `🎉 ${label} 등급 첫 풀이!`,
        body: `"${p.problemTitle}" 을 해결하며 ${label} 등급에 진입했어요`,
        link: `/problems/${p.problemId}`,
      }
    }
    default: {
      const _exhaustive: never = n.type as never
      void _exhaustive
      return {
        icon: <MessageSquare size={ICON_SIZE} />,
        color: 'var(--text)',
        title: '알림',
        body: '',
        link: '/',
      }
    }
  }
}

/** 1분 이내, n분 전, n시간 전, n일 전 등 가벼운 상대 시간 */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '방금'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  COMMENT: '댓글',
  ADMIN_REPLY: '관리자 답변',
  STATUS_CHANGE: '상태 변경',
  POST_HIDDEN: '숨김 처리',
  REPORT_RESOLVED: '신고 결과',
  NEW_REPORT: '새 신고',
  TIER_UP: '티어 진입',
}

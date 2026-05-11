export type ProblemSource =
  | 'PRACTICE'
  | 'KAKAO_BLIND'
  | 'KAKAO_INTERNSHIP'
  | 'KAKAO_CODE'
  | 'MONTHLY_CHALLENGE'
  | 'WEEKLY_CHALLENGE'
  | 'SUMMER_WINTER'
  | 'PCCE'
  | 'PCCP'
  | 'SQL'
  | 'OTHER'

export const SOURCE_LABEL: Record<ProblemSource, string> = {
  PRACTICE: '연습문제',
  KAKAO_BLIND: '카카오 공채',
  KAKAO_INTERNSHIP: '카카오 인턴',
  KAKAO_CODE: '카카오코드',
  MONTHLY_CHALLENGE: '월간 챌린지',
  WEEKLY_CHALLENGE: '위클리 챌린지',
  SUMMER_WINTER: 'Summer/Winter',
  PCCE: 'PCCE',
  PCCP: 'PCCP',
  SQL: 'SQL',
  OTHER: '기타',
}

export const LEVEL_COLOR: Record<number, string> = {
  0: 'text-gray-400',
  1: '#10b981',
  2: '#3b82f6',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#7c3aed',
}

export type PostType =
  | 'QUESTION'
  | 'SOLUTION_SHARE'
  | 'FEEDBACK'
  | 'BUG_REPORT'
  | 'FEATURE_REQUEST'

export const POST_TYPE_LABEL: Record<PostType, string> = {
  QUESTION: '질문',
  SOLUTION_SHARE: '풀이 공유',
  FEEDBACK: '레벨/태그 의견',
  BUG_REPORT: '버그 제보',
  FEATURE_REQUEST: '기능 요청',
}

export const COMMUNITY_POST_TYPES: PostType[] = ['QUESTION', 'SOLUTION_SHARE']
export const SUGGESTION_POST_TYPES: PostType[] = [
  'FEEDBACK',
  'BUG_REPORT',
  'FEATURE_REQUEST',
]
// 추천/비추천 가능한 게시글 타입 (커뮤니티만)
export const VOTABLE_POST_TYPES: PostType[] = ['QUESTION', 'SOLUTION_SHARE']

export const POST_TYPE_STYLE: Record<PostType, { bg: string; text: string }> = {
  QUESTION:        { bg: '#1e3a5f', text: '#60a5fa' },
  SOLUTION_SHARE:  { bg: '#064e3b', text: '#10b981' },
  FEEDBACK:        { bg: '#451a03', text: '#f59e0b' },
  BUG_REPORT:      { bg: '#2a1212', text: '#fca5a5' },
  FEATURE_REQUEST: { bg: '#1a1a2a', text: '#c4b5fd' },
}

export type SuggestionStatus = 'IN_PROGRESS' | 'RESOLVED'

export const STATUS_LABEL: Record<SuggestionStatus, string> = {
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결됨',
}

export const STATUS_COLOR: Record<SuggestionStatus, { bg: string; text: string }> = {
  IN_PROGRESS: { bg: '#451a03', text: '#f59e0b' },
  RESOLVED:    { bg: '#064e3b', text: '#10b981' },
}

export type UserRole = 'USER' | 'ADMIN'
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'NAVER'

export interface User {
  id: number
  email: string
  nickname: string
  role: UserRole
  emailVerified: boolean
  provider: AuthProvider
  createdAt: string
  _count?: { solutions: number; notes: number }
}

export interface AlgorithmTag {
  id: number
  name: string
  _count?: { problems: number }
}

export interface Problem {
  id: number
  title: string
  source: ProblemSource
  level: number
  adjustedLevel?: number
  link: string
  tags: { tag: AlgorithmTag }[]
  _count?: { solutions: number }
}

export interface Memo {
  id: number
  wrongReason?: string
  logic?: string
  keyFunctions?: string
  freeNote?: string
}

export interface Solution {
  id: number
  userId: number
  problemId: number
  code: string
  language: string
  starred: boolean
  createdAt: string
  updatedAt: string
  problem: Problem
  memo?: Memo
}

export type NoteType = 'CODE' | 'PATTERN' | 'MISTAKE' | 'OTHER'

export const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  CODE: '코드',
  PATTERN: '접근 패턴',
  MISTAKE: '오답 노트',
  OTHER: '기타',
}

export const NOTE_TYPE_COLOR: Record<NoteType, { bg: string; text: string }> = {
  CODE:    { bg: '#1e293b', text: '#93c5fd' },
  PATTERN: { bg: '#1a2a1a', text: '#86efac' },
  MISTAKE: { bg: '#2a1212', text: '#fca5a5' },
  OTHER:   { bg: '#1a1a2a', text: '#c4b5fd' },
}

export interface Note {
  id: number
  type: NoteType
  title: string
  body: string
  language?: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: number
  content: string
  createdAt: string
  user: { id: number; nickname: string }
}

export interface CommunityPost {
  id: number
  type: PostType
  title: string
  content: string
  isPrivate: boolean
  hidden: boolean
  status?: SuggestionStatus | null
  adminReply?: string | null
  adminReplyAt?: string | null
  createdAt: string
  user: { id: number; nickname: string }
  problem?: { id: number; title: string } | null
  comments?: Comment[]
  _count?: { comments: number }
  upvotes: number
  downvotes: number
  score: number
  myVote: number // 1, -1, 0
}

export type ReportStatus = 'OPEN' | 'HANDLED' | 'DISMISSED'

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: '미처리',
  HANDLED: '처리 완료',
  DISMISSED: '기각',
}

export const REPORT_STATUS_COLOR: Record<ReportStatus, { bg: string; text: string }> = {
  OPEN:      { bg: '#451a03', text: '#f59e0b' },
  HANDLED:   { bg: '#064e3b', text: '#10b981' },
  DISMISSED: { bg: '#1a1d24', text: '#9ca3af' },
}

export interface PostReport {
  id: number
  reason: string
  status: ReportStatus
  adminNote?: string | null
  createdAt: string
  user: { id: number; nickname: string }
  post: {
    id: number
    title: string
    type: PostType
    hidden: boolean
    userId: number
    user: { id: number; nickname: string }
    _count: { reports: number }
  }
}

export interface PublicUserStats {
  id: number
  nickname: string
  createdAt: string
  solveCount: number
  mainTierFamily: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | null
  tierFamilyCounts: Record<string, number>
  algorithmTagCounts: Record<string, number>
}

export type NotificationType =
  | 'COMMENT'
  | 'ADMIN_REPLY'
  | 'STATUS_CHANGE'
  | 'POST_HIDDEN'
  | 'REPORT_RESOLVED'
  | 'NEW_REPORT'
  | 'TIER_UP'
  | 'STALE_SUGGESTION'

export interface Notification {
  id: number
  type: NotificationType
  payload: Record<string, any>
  isRead: boolean
  readAt?: string | null
  createdAt: string
}

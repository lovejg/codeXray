import client from './client'
import type {
  CommunityPost,
  PostReport,
  PostType,
  PublicUserStats,
  ReportStatus,
  SuggestionStatus,
} from '../types'

export const communityApi = {
  getPosts: (params?: {
    type?: PostType
    types?: PostType[]
    problemId?: number
    status?: SuggestionStatus
    sort?: 'recent' | 'votes'
    authorId?: number
  }): Promise<CommunityPost[]> => {
    const { types, ...rest } = params ?? {}
    const query: Record<string, string | number> = { ...rest }
    if (types && types.length > 0) query.types = types.join(',')
    return client.get('/community/posts', { params: query }).then((r) => r.data)
  },
  getPost: (id: number): Promise<CommunityPost> => client.get(`/community/posts/${id}`).then((r) => r.data),
  createPost: (data: {
    type: PostType
    title: string
    content: string
    problemId?: number
    isPrivate?: boolean
  }) => client.post('/community/posts', data).then((r) => r.data),
  updatePost: (id: number, data: { title?: string; content?: string; isPrivate?: boolean }) =>
    client.put(`/community/posts/${id}`, data).then((r) => r.data),
  deletePost: (id: number) => client.delete(`/community/posts/${id}`).then((r) => r.data),
  updateStatus: (id: number, status: SuggestionStatus) =>
    client.patch(`/community/posts/${id}/status`, { status }).then((r) => r.data),
  updateAdminReply: (id: number, adminReply: string) =>
    client.patch(`/community/posts/${id}/admin-reply`, { adminReply }).then((r) => r.data),
  createComment: (postId: number, content: string) =>
    client.post(`/community/posts/${postId}/comments`, { content }).then((r) => r.data),
  deleteComment: (id: number) => client.delete(`/community/comments/${id}`).then((r) => r.data),

  // 투표
  vote: (postId: number, value: 1 | -1) =>
    client.post(`/community/posts/${postId}/vote`, { value }).then((r) => r.data),
  removeVote: (postId: number) =>
    client.delete(`/community/posts/${postId}/vote`).then((r) => r.data),

  // 신고
  report: (postId: number, reason: string) =>
    client.post(`/community/posts/${postId}/report`, { reason }).then((r) => r.data),

  // 관리자
  adminListReports: (status?: ReportStatus): Promise<PostReport[]> =>
    client.get('/community/admin/reports', { params: status ? { status } : {} }).then((r) => r.data),
  adminUpdateReport: (id: number, data: { status: ReportStatus; adminNote?: string }) =>
    client.patch(`/community/admin/reports/${id}`, data).then((r) => r.data),
  adminHidePost: (postId: number, hidden: boolean) =>
    client.patch(`/community/admin/posts/${postId}/hide`, { hidden }).then((r) => r.data),
}

export const userStatsApi = {
  getPublicStats: (userId: number): Promise<PublicUserStats> =>
    client.get(`/users/${userId}/stats`).then((r) => r.data),
}

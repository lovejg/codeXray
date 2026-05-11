import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, ArrowLeft, Flag, EyeOff } from 'lucide-react'
import { communityApi } from '../api/community'
import type { PostType } from '../types'
import { VOTABLE_POST_TYPES } from '../types'
import { useAuthStore, useIsAdmin } from '../store/authStore'
import PostContent from '../components/common/PostContent'
import VoteButtons from '../components/common/VoteButtons'
import AuthorStats from '../components/common/AuthorStats'
import ReportModal from '../components/common/ReportModal'
import PostTypeBadge from '../components/common/PostTypeBadge'
import UserLink from '../components/common/UserLink'

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = useIsAdmin()
  const qc = useQueryClient()
  const [comment, setComment] = useState('')
  const [showReport, setShowReport] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => communityApi.getPost(Number(id)),
  })

  const commentMutation = useMutation({
    mutationFn: () => communityApi.createComment(Number(id), comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['post', id] })
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: () => communityApi.deletePost(Number(id)),
    onSuccess: () => navigate('/community'),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (cid: number) => communityApi.deleteComment(cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  const hideMutation = useMutation({
    mutationFn: (hidden: boolean) => communityApi.adminHidePost(Number(id), hidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  if (isLoading) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
  if (!post) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>게시글을 찾을 수 없습니다.</div>

  const isOwner = user?.id === post.user.id
  const canDelete = isOwner || isAdmin
  const canReport = user && !isOwner
  const canVote = VOTABLE_POST_TYPES.includes(post.type as PostType)

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm w-fit cursor-pointer" style={{ color: 'var(--text)' }}>
        <ArrowLeft size={15} /> 목록으로
      </button>

      {/* 숨김 알림 (작성자/관리자에게만 노출) */}
      {post.hidden && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg border"
          style={{ background: '#2a1212', borderColor: '#7f1d1d', color: '#fca5a5' }}
        >
          <EyeOff size={14} />
          <span className="text-sm">이 게시글은 관리자에 의해 숨김 처리되어 다른 사용자에게 보이지 않습니다.</span>
        </div>
      )}

      {/* 본문 */}
      <div className="rounded-xl border p-6 flex flex-col gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PostTypeBadge type={post.type as PostType} />
              {post.problem && (
                <Link to={`/problems/${post.problem.id}`} className="text-xs hover:underline" style={{ color: 'var(--text)' }}>
                  {post.problem.title}
                </Link>
              )}
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{post.title}</h1>
            <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: 'var(--text)' }}>
              <UserLink userId={post.user.id} nickname={post.user.nickname} className="font-medium" />
              <span>·</span>
              <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="mt-1">
              <AuthorStats userId={post.user.id} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {canReport && (
              <button
                onClick={() => setShowReport(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors hover:brightness-110"
                style={{ background: 'rgba(245, 158, 11, 0.10)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <Flag size={12} />
                신고
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => hideMutation.mutate(!post.hidden)}
                disabled={hideMutation.isPending}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors hover:brightness-110 disabled:opacity-60"
                style={
                  post.hidden
                    ? { background: 'rgba(16, 185, 129, 0.10)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }
                    : { background: 'var(--bg-hover)', color: 'var(--text)', borderColor: 'var(--border)' }
                }
              >
                <EyeOff size={12} />
                {post.hidden ? '숨김 해제' : '숨김 처리'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => { if (confirm('게시글을 삭제할까요?')) deletePostMutation.mutate() }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors hover:brightness-110"
                style={{ background: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                <Trash2 size={12} />
                삭제
              </button>
            )}
          </div>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <PostContent content={post.content} />
        </div>
        {canVote && (
          <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <VoteButtons
              postId={post.id}
              upvotes={post.upvotes ?? 0}
              downvotes={post.downvotes ?? 0}
              myVote={post.myVote ?? 0}
              disabled={isOwner || post.hidden}
            />
          </div>
        )}
      </div>

      {/* 댓글 */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>댓글 {post.comments?.length ?? 0}개</h2>
        {post.comments?.map((c: any) => (
          <div key={c.id} className="rounded-xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5 text-xs">
                <UserLink userId={c.user.id} nickname={c.user.nickname} className="font-medium" />
                <span style={{ color: 'var(--text)' }}>{new Date(c.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <PostContent content={c.content} compact />
            </div>
            {(user?.id === c.user.id || isAdmin) && (
              <button
                onClick={() => deleteCommentMutation.mutate(c.id)}
                className="p-1.5 cursor-pointer"
                style={{ color: 'var(--text)' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}

        {user ? (
          <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={'댓글을 입력하세요... (코드는 ```python 처럼 감싸거나 `코드` 로 인라인 표시)'}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none border"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
            />
            <button
              onClick={() => commentMutation.mutate()}
              disabled={commentMutation.isPending || !comment.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium w-fit cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              댓글 등록
            </button>
          </div>
        ) : (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text)' }}>
            <Link to="/login" style={{ color: 'var(--accent-light)' }}>로그인</Link> 후 댓글을 남길 수 있습니다.
          </p>
        )}
      </div>

      {showReport && <ReportModal postId={post.id} onClose={() => setShowReport(false)} />}
    </div>
  )
}

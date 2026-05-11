import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, ArrowLeft, Lock, ShieldCheck, EyeOff } from 'lucide-react'
import { communityApi } from '../api/community'
import type { PostType, SuggestionStatus } from '../types'
import { STATUS_LABEL, STATUS_COLOR } from '../types'
import { useAuthStore, useIsAdmin } from '../store/authStore'
import PostContent from '../components/common/PostContent'
import PostTypeBadge from '../components/common/PostTypeBadge'
import UserLink from '../components/common/UserLink'

const STATUSES: SuggestionStatus[] = ['IN_PROGRESS', 'RESOLVED']

export default function SuggestionPostPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = useIsAdmin()
  const qc = useQueryClient()
  const [comment, setComment] = useState('')
  const [replyDraft, setReplyDraft] = useState('')
  const [replyEditing, setReplyEditing] = useState(false)

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => communityApi.getPost(Number(id)),
  })

  useEffect(() => {
    if (post?.adminReply) setReplyDraft(post.adminReply)
  }, [post?.adminReply])

  const commentMutation = useMutation({
    mutationFn: () => communityApi.createComment(Number(id), comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['post', id] })
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: () => communityApi.deletePost(Number(id)),
    onSuccess: () => navigate('/suggestions'),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (cid: number) => communityApi.deleteComment(cid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  const statusMutation = useMutation({
    mutationFn: (s: SuggestionStatus) => communityApi.updateStatus(Number(id), s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['post', id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const replyMutation = useMutation({
    mutationFn: () => communityApi.updateAdminReply(Number(id), replyDraft),
    onSuccess: () => {
      setReplyEditing(false)
      qc.invalidateQueries({ queryKey: ['post', id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const hideMutation = useMutation({
    mutationFn: (hidden: boolean) => communityApi.adminHidePost(Number(id), hidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['post', id] }),
  })

  if (isLoading) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>불러오는 중...</div>
  if (!post) return <div className="text-center py-20" style={{ color: 'var(--text)' }}>게시글을 찾을 수 없습니다.</div>

  const sc = post.status ? STATUS_COLOR[post.status as SuggestionStatus] : null
  const canDelete = user?.id === post.user.id || isAdmin

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm w-fit cursor-pointer" style={{ color: 'var(--text)' }}>
        <ArrowLeft size={15} /> 목록으로
      </button>

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
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <PostTypeBadge type={post.type as PostType} />
              {sc && (
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: sc.bg, color: sc.text }}>
                  {STATUS_LABEL[post.status as SuggestionStatus]}
                </span>
              )}
              {post.isPrivate && (
                <span className="text-xs flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
                  <Lock size={11} /> 비공개
                </span>
              )}
              {post.problem && (
                <Link to={`/problems/${post.problem.id}`} className="text-xs hover:underline" style={{ color: 'var(--text)' }}>
                  {post.problem.title}
                </Link>
              )}
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>{post.title}</h1>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text)' }}>
              <UserLink userId={post.user.id} nickname={post.user.nickname} />
              <span>·</span>
              <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
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
      </div>

      {/* 관리자 상태 변경 */}
      {isAdmin && (
        <div className="rounded-xl border p-4 flex items-center gap-3 flex-wrap" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-border)' }}>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--accent-light)' }}>
            <ShieldCheck size={14} /> 관리자 상태 변경
          </span>
          {STATUSES.map((s) => {
            const active = post.status === s
            const c = STATUS_COLOR[s]
            return (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isPending || active}
                className="px-2.5 py-1 rounded-lg text-xs cursor-pointer border disabled:opacity-60 disabled:cursor-default"
                style={{
                  background: active ? c.bg : 'var(--bg-hover)',
                  color: active ? c.text : 'var(--text)',
                  borderColor: active ? c.text : 'var(--border)',
                }}
              >
                {STATUS_LABEL[s]}
              </button>
            )
          })}
        </div>
      )}

      {/* 관리자 답변 */}
      {(post.adminReply || isAdmin) && (
        <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: '#10b981', borderLeftWidth: 4 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: '#10b981' }} />
              <span className="font-medium text-sm" style={{ color: '#10b981' }}>관리자 답변</span>
              {post.adminReplyAt && (
                <span className="text-xs" style={{ color: 'var(--text)' }}>
                  {new Date(post.adminReplyAt).toLocaleDateString('ko-KR')}
                </span>
              )}
            </div>
            {isAdmin && !replyEditing && (
              <button
                onClick={() => setReplyEditing(true)}
                className="text-xs px-3 py-1 rounded-lg cursor-pointer"
                style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
              >
                {post.adminReply ? '수정' : '답변 작성'}
              </button>
            )}
          </div>
          {replyEditing ? (
            <>
              <textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                rows={4}
                placeholder={'관리자 답변 내용을 입력하세요. 비워두면 답변이 제거됩니다.\n코드: ```언어 ... ``` 또는 `인라인`'}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none border font-mono"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-h)' }}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setReplyEditing(false); setReplyDraft(post.adminReply ?? '') }}
                  className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
                >
                  취소
                </button>
                <button
                  onClick={() => replyMutation.mutate()}
                  disabled={replyMutation.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-60"
                  style={{ background: '#10b981', color: '#fff' }}
                >
                  {replyMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </>
          ) : post.adminReply ? (
            <PostContent content={post.adminReply} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.6 }}>아직 관리자 답변이 없습니다.</p>
          )}
        </div>
      )}

      {/* 댓글 */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>댓글 {post.comments?.length ?? 0}개</h2>
        {post.comments?.map((c: any) => (
          <div key={c.id} className="rounded-xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <UserLink userId={c.user.id} nickname={c.user.nickname} className="text-xs font-medium" />
                <span className="text-xs" style={{ color: 'var(--text)' }}>{new Date(c.createdAt).toLocaleDateString('ko-KR')}</span>
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
    </div>
  )
}

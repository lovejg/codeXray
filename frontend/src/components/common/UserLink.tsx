import { Link } from 'react-router-dom'

interface Props {
  userId: number
  nickname: string
  className?: string
}

/**
 * 닉네임을 공개 프로필 링크로 렌더.
 * 탈퇴한 사용자(sentinel id=0)는 링크 없이 비활성 텍스트로 표시.
 */
export default function UserLink({ userId, nickname, className }: Props) {
  if (userId <= 0) {
    return (
      <span className={className} style={{ opacity: 0.6, fontStyle: 'italic' }}>
        {nickname}
      </span>
    )
  }
  return (
    <Link
      to={`/users/${userId}`}
      onClick={(e) => e.stopPropagation()}
      className={`hover:underline ${className ?? ''}`}
    >
      {nickname}
    </Link>
  )
}

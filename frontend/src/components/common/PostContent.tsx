import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import CodeEditor from './CodeEditor'
import CopyButton from './CopyButton'

interface Props {
  content: string
  compact?: boolean // 댓글처럼 짧은 렌더링
}

export default function PostContent({ content, compact = false }: Props) {
  const components: Components = {
    code({ className, children, ...rest }) {
      const match = /language-(\w+)/.exec(className ?? '')
      const raw = String(children ?? '').replace(/\n$/, '')
      const isBlock = !!match || raw.includes('\n')

      if (isBlock) {
        const lang = match?.[1] ?? 'plaintext'
        return (
          <div className="my-3 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            <div
              className="px-3 py-1.5 text-[11px] flex items-center justify-between border-b"
              style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              <span>{lang}</span>
              <CopyButton text={raw} />
            </div>
            <CodeEditor value={raw} language={lang} readOnly minHeight="auto" />
          </div>
        )
      }
      return (
        <code
          {...rest}
          className="px-1 py-0.5 rounded text-[0.9em]"
          style={{ background: 'var(--bg)', color: 'var(--accent-light)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        >
          {children}
        </code>
      )
    },
    // <pre> 가 <code> 를 한번 더 감싸면서 레이아웃이 깨지는 걸 막기 위해 unwrap
    pre({ children }) {
      return <>{children}</>
    },
    p({ children }) {
      return <p className={compact ? 'my-1' : 'my-2'}>{children}</p>
    },
    ul({ children }) {
      return <ul className="my-2 pl-5 list-disc">{children}</ul>
    },
    ol({ children }) {
      return <ol className="my-2 pl-5 list-decimal">{children}</ol>
    },
    li({ children }) {
      return <li className="my-0.5">{children}</li>
    },
    h1({ children }) {
      return <h3 className="text-base font-bold mt-3 mb-1" style={{ color: 'var(--text-h)' }}>{children}</h3>
    },
    h2({ children }) {
      return <h3 className="text-base font-bold mt-3 mb-1" style={{ color: 'var(--text-h)' }}>{children}</h3>
    },
    h3({ children }) {
      return <h3 className="text-sm font-semibold mt-2 mb-1" style={{ color: 'var(--text-h)' }}>{children}</h3>
    },
    a({ children, href }) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--accent-light)' }}>
          {children}
        </a>
      )
    },
    blockquote({ children }) {
      return (
        <blockquote
          className="my-2 pl-3 border-l-2"
          style={{ borderColor: 'var(--accent-border)', color: 'var(--text)' }}
        >
          {children}
        </blockquote>
      )
    },
    hr() {
      return <hr className="my-3" style={{ borderColor: 'var(--border)' }} />
    },
  }

  return (
    <div
      className={`text-sm leading-relaxed ${compact ? '' : ''}`}
      style={{ color: 'var(--text-h)', whiteSpace: 'normal', wordBreak: 'break-word' }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

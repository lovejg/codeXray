import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Sparkles, Copy, Check, AlertTriangle, ArrowLeft } from 'lucide-react'

/**
 * 프로그래머스 풀이 페이지에서 코드/URL/언어를 추출해 codexray 로 전달하는 북마클릿.
 * 한 줄 javascript: URL 형태.
 */
function buildBookmarkletHref(host: string): string {
  // 단일 라인 + 자기 호출 함수. 여러 에디터(Ace/CodeMirror/Monaco/textarea) 순차 시도.
  const body = `(function(){
    var u=location.href,c='';
    try{var a=document.querySelector('.ace_editor');if(a&&window.ace){c=window.ace.edit(a).getValue();}}catch(e){}
    if(!c){try{var cm=document.querySelector('.CodeMirror');if(cm&&cm.CodeMirror){c=cm.CodeMirror.getValue();}}catch(e){}}
    if(!c){try{var cv=document.querySelector('.cm-content');if(cv){c=cv.innerText||'';}}catch(e){}}
    if(!c&&window.monaco){try{var es=window.monaco.editor.getEditors();if(es&&es.length){c=es[0].getValue();}}catch(e){}}
    if(!c){var t=document.querySelector('textarea');if(t&&t.value){c=t.value;}}
    if(!c){alert('코드를 추출할 수 없습니다. codexray 에서 직접 붙여넣어 주세요.');return;}
    var l='';try{var sels=document.querySelectorAll('select');for(var i=0;i<sels.length;i++){var v=(sels[i].value||'').toLowerCase();if(/python|java|cpp|c\\+\\+|javascript|typescript|kotlin|swift|go|^c$/.test(v)){l=v;break;}}}catch(e){}
    var p=new URLSearchParams();p.set('problemUrl',u);if(c)p.set('code',c);if(l)p.set('language',l);
    window.open('${host}/solutions/new?'+p.toString(),'_blank');
  })();`
  // 줄바꿈 + 들여쓰기 압축
  const compact = body.replace(/\s+/g, ' ').replace(/\n/g, '')
  return 'javascript:' + compact
}

export default function BookmarkletPage() {
  const host = typeof window !== 'undefined' ? window.location.origin : ''
  const href = useMemo(() => buildBookmarkletHref(host), [host])
  const [copied, setCopied] = useState(false)
  const linkRef = useRef<HTMLAnchorElement>(null)

  // React 가 javascript: URL 을 href 로 막기 때문에 DOM API 로 직접 셋
  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.setAttribute('href', href)
    }
  }, [href])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <Link to="/solutions/new" className="flex items-center gap-1.5 text-sm w-fit cursor-pointer" style={{ color: 'var(--text)' }}>
        <ArrowLeft size={14} /> 풀이 등록으로
      </Link>

      <div className="flex items-center gap-2">
        <Sparkles size={20} style={{ color: 'var(--accent-light)' }} />
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>북마클릿으로 빠르게 가져오기</h1>
      </div>

      <p className="text-sm" style={{ color: 'var(--text)' }}>
        프로그래머스 풀이 페이지에서 클릭 한 번으로 코드/URL/언어를 codexray 로 가져옵니다.
        한 번만 설치하면 평생 쓸 수 있습니다.
      </p>

      {/* Step 1: 설치 */}
      <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            1
          </span>
          <h2 className="font-semibold" style={{ color: 'var(--text-h)' }}>아래 버튼을 브라우저 북마크 바로 드래그</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--text)' }}>
          버튼을 드래그해서 브라우저 상단 북마크 바에 놓으세요. 클릭이 아니라 <b>드래그</b>입니다.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            ref={linkRef}
            onClick={(e) => {
              e.preventDefault()
              alert('이 버튼은 클릭이 아니라 북마크 바로 드래그하세요.')
            }}
            draggable
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-grab active:cursor-grabbing"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Bookmark size={14} fill="currentColor" />
            북마클릿
          </a>
          <button
            onClick={handleCopy}
            className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? '복사됨' : '드래그 안 되면 코드 복사'}
          </button>
        </div>
        <details className="text-xs" style={{ color: 'var(--text)' }}>
          <summary className="cursor-pointer" style={{ color: 'var(--accent-light)' }}>드래그가 안 될 때 (모바일 / Safari 등)</summary>
          <ol className="mt-2 ml-5 list-decimal flex flex-col gap-1">
            <li>위 "드래그 안 되면 코드 복사" 클릭</li>
            <li>북마크 바 빈 곳 우클릭 → "북마크 추가" 또는 "Ctrl+D"</li>
            <li>이름은 "북마클릿", URL 자리에 복사한 코드를 붙여넣기</li>
            <li>저장</li>
          </ol>
        </details>
      </div>

      {/* Step 2: 사용 */}
      <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            2
          </span>
          <h2 className="font-semibold" style={{ color: 'var(--text-h)' }}>프로그래머스에서 풀이 작성 후 클릭</h2>
        </div>
        <ol className="text-sm flex flex-col gap-1.5 ml-5 list-decimal" style={{ color: 'var(--text)' }}>
          <li>프로그래머스에서 문제를 풀고 코드 에디터에 코드 작성</li>
          <li>북마크 바의 <b style={{ color: 'var(--text-h)' }}>북마클릿</b> 클릭</li>
          <li>codexray 풀이 등록 페이지가 새 탭으로 열림 (코드/URL/언어 자동 prefill)</li>
          <li>확인 후 <b style={{ color: 'var(--text-h)' }}>등록하기</b> 클릭</li>
        </ol>
      </div>

      {/* 한계 */}
      <div className="rounded-xl border p-4 flex items-start gap-2.5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <AlertTriangle size={14} style={{ color: '#f59e0b', marginTop: 2 }} />
        <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text)' }}>
          <p>
            <b style={{ color: 'var(--text-h)' }}>한계 안내:</b>
          </p>
          <ul className="ml-4 list-disc flex flex-col gap-1">
            <li>프로그래머스가 사용하는 코드 에디터(Ace/CodeMirror/Monaco)를 자동 감지합니다. 에디터 변경 시 작동 안 할 수 있습니다.</li>
            <li>언어가 자동 인식 안 되면 codexray 에서 코드 분석 후 추정 — 다른 언어면 수동 선택하면 됩니다.</li>
            <li>DB 에 없는 신규 문제는 URL 매칭 실패 — 우선 codexray 운영자에게 문제 추가 요청 후 등록하세요.</li>
            <li>이 북마클릿은 codexray 가 호스팅된 도메인(<code style={{ background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: 3 }}>{host}</code>) 으로 새 탭을 엽니다. 도메인이 바뀌면 다시 설치해야 합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

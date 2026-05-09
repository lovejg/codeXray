/**
 * 외부에서 받은 임의의 언어 표기를 codexray 의 표준 키로 매핑.
 * 예: "Python3" → "python", "C++" → "cpp"
 * 매핑 실패 시 null.
 */
export function normalizeLanguageKey(input: string): string | null {
  const k = input.trim().toLowerCase()
  if (!k) return null
  const map: Record<string, string> = {
    python: 'python',
    python3: 'python',
    py: 'python',
    py3: 'python',
    javascript: 'javascript',
    js: 'javascript',
    'node.js': 'javascript',
    nodejs: 'javascript',
    typescript: 'typescript',
    ts: 'typescript',
    java: 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    cplusplus: 'cpp',
    'c++17': 'cpp',
    'c++14': 'cpp',
    c: 'c',
    'c language': 'c',
    kotlin: 'kotlin',
    kt: 'kotlin',
    swift: 'swift',
    go: 'go',
    golang: 'go',
  }
  return map[k] ?? null
}

/**
 * 코드 스니펫에서 사용 언어를 추측한다.
 * 자신 있는 경우에만 언어 문자열을 반환하고, 아니면 null.
 * 반환 값은 SolutionFormPage / CommunityFormPage 의 LANGS 와 일치해야 함.
 */
export function detectLanguage(code: string): string | null {
  const c = code.slice(0, 4000) // 너무 큰 입력 방지
  if (c.trim().length < 8) return null

  // ── Python ─────────────────────────────────────────
  if (/^\s*def\s+\w+\s*\([^)]*\)\s*(->\s*[^:]+)?\s*:/m.test(c)) return 'python'
  if (/^\s*from\s+\w[\w.]*\s+import\s/m.test(c)) return 'python'
  if (/^\s*import\s+\w[\w.]*(\s*,\s*\w[\w.]*)*\s*$/m.test(c)) return 'python'
  if (/^\s*class\s+\w+(\s*\([^)]*\))?\s*:\s*$/m.test(c)) return 'python'
  if (/\bprint\s*\([^)]*\)\s*$/m.test(c) && !/;\s*$/m.test(c)) return 'python'

  // ── C++ (C 보다 먼저 — 좁은 패턴 우선) ──────────────
  if (/#include\s*<iostream>/.test(c)) return 'cpp'
  if (/#include\s*<bits\/stdc\+\+\.h>/.test(c)) return 'cpp'
  if (/\bstd::\w+/.test(c)) return 'cpp'
  if (/\busing\s+namespace\s+std\b/.test(c)) return 'cpp'

  // ── C ───────────────────────────────────────────────
  if (/#include\s*<stdio\.h>/.test(c)) return 'c'

  // ── Java ────────────────────────────────────────────
  if (/\bpublic\s+class\s+\w+/.test(c)) return 'java'
  if (/\bSystem\.out\.print(ln)?\s*\(/.test(c)) return 'java'
  if (/\bpublic\s+static\s+void\s+main\s*\(/.test(c)) return 'java'

  // ── Go ──────────────────────────────────────────────
  if (/^\s*package\s+main\b/m.test(c)) return 'go'
  if (/\bfmt\.\w+\s*\(/.test(c)) return 'go'

  // ── Kotlin ──────────────────────────────────────────
  if (/^\s*fun\s+\w+\s*\(.*\)\s*:?\s*\w*\s*\{/m.test(c)) return 'kotlin'
  if (/\bcompanion\s+object\b/.test(c)) return 'kotlin'

  // ── Swift ───────────────────────────────────────────
  if (/\bimport\s+Foundation\b/.test(c)) return 'swift'
  if (/^\s*func\s+\w+\s*\(.*\)\s*->/m.test(c)) return 'swift'

  // ── TypeScript (JS 보다 먼저) ─────────────────────
  if (/\binterface\s+\w+\s*\{/.test(c)) return 'typescript'
  if (/\btype\s+\w+\s*=\s*[^=]/.test(c)) return 'typescript'
  if (/:\s*(string|number|boolean|void|unknown|any)\b/.test(c)) return 'typescript'

  // ── JavaScript ─────────────────────────────────────
  if (/\bconsole\.log\s*\(/.test(c)) return 'javascript'
  if (/=>\s*\{/.test(c) || /^\s*const\s+\w+\s*=/.test(c) || /^\s*function\s+\w+\s*\(/m.test(c)) {
    return 'javascript'
  }

  return null
}

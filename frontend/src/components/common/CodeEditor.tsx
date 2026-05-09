import CodeMirror from '@uiw/react-codemirror'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { go } from '@codemirror/lang-go'
import type { Extension } from '@codemirror/state'

const LANG_EXTENSIONS: Record<string, () => Extension> = {
  python: python,
  javascript: javascript,
  typescript: () => javascript({ typescript: true }),
  java: java,
  cpp: cpp,
  c: cpp,
  kotlin: java, // 비슷한 JVM 계열
  go: go,
}

interface Props {
  value: string
  onChange?: (value: string) => void
  language: string
  readOnly?: boolean
  minHeight?: string
  placeholder?: string
}

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  minHeight = '400px',
  placeholder,
}: Props) {
  const langExt = LANG_EXTENSIONS[language]
  const extensions = langExt ? [langExt()] : []

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={vscodeDark}
      readOnly={readOnly}
      editable={!readOnly}
      placeholder={placeholder}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: !readOnly,
        bracketMatching: true,
        closeBrackets: !readOnly,
        autocompletion: !readOnly,
        indentOnInput: !readOnly,
      }}
      style={{ fontSize: '14px', minHeight }}
    />
  )
}

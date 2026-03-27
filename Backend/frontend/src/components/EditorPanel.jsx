    import { useState } from 'react'
    import Editor from '@monaco-editor/react'
    import styles from './EditorPanel.module.css'

    const LANGUAGES = ['python', 'javascript', 'cpp', 'java']

    const STARTER_CODE = {
    python: '# Write your solution here\n\n',
    javascript: '// Write your solution here\n\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
    }

    export default function EditorPanel({ theme, onSubmit, isSubmitting, verdict }) {
    const [language, setLanguage] = useState('python')
    const [code, setCode] = useState(STARTER_CODE['python'])

    const handleLanguageChange = (e) => {
        const lang = e.target.value
        setLanguage(lang)
        setCode(STARTER_CODE[lang])
    }

    const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light'

    return (
        <div className={styles.panel}>

        {/* Toolbar */}
        <div className={styles.toolbar}>
            <select
            className={styles.langSelect}
            value={language}
            onChange={handleLanguageChange}
            >
            {LANGUAGES.map(l => (
                <option key={l} value={l}>{l}</option>
            ))}
            </select>

            <button
            className={styles.submitBtn}
            onClick={() => onSubmit(code, language)}
            disabled={isSubmitting}
            >
            {isSubmitting
                ? <><span className={styles.spinner} /> Judging...</>
                : <>Submit</>
            }
            </button>
        </div>

        {/* Monaco Editor */}
        <div className={styles.editorWrap}>
            <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            value={code}
            theme={monacoTheme}
            onChange={(val) => setCode(val || '')}
            options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            }}
            />
        </div>

        {/* Verdict panel */}
        {verdict && <VerdictPanel verdict={verdict} />}
        </div>
    )
    }

    function VerdictPanel({ verdict }) {
    const isAccepted = verdict.verdict === 'Accepted'
    const isError = ['Runtime Error', 'Time Limit Exceeded'].includes(verdict.verdict)

    return (
        <div className={styles.verdictPanel} data-status={isAccepted ? 'pass' : isError ? 'error' : 'fail'}>
        <div className={styles.verdictHeader}>
            <span className={styles.verdictIcon}>
            {isAccepted ? '✓' : isError ? '⚡' : '✗'}
            </span>
            <span className={styles.verdictTitle}>{verdict.verdict}</span>
            <span className={styles.verdictScore}>
            {verdict.passed}/{verdict.total} test cases
            </span>
        </div>

        {verdict.results?.map((r, i) => (
            <div key={i} className={styles.testCase} data-passed={r.passed}>
            <div className={styles.testCaseHeader}>
                <span>Test {r.test_case}</span>
                <span>{r.passed ? 'Passed' : r.error || 'Wrong Answer'}</span>
            </div>
            {!r.passed && (
                <div className={styles.testCaseDetails}>
                {r.input && <div><span>Input:</span><pre>{r.input}</pre></div>}
                <div><span>Expected:</span><pre>{r.expected}</pre></div>
                <div><span>Got:</span><pre>{r.got || r.error}</pre></div>
                </div>
            )}
            </div>
        ))}
        </div>
    )
    }
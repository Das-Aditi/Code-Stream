    import { useState } from 'react'
    import Editor from '@monaco-editor/react'
    import TracePanel from './TracePanel'
    import styles from './EditorPanel.module.css'
    import axios from 'axios'

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
    const [traceData, setTraceData] = useState(null)
    const [isTracing, setIsTracing] = useState(false)
    const [showTrace, setShowTrace] = useState(false)

    const handleLanguageChange = (e) => {
        const lang = e.target.value
        setLanguage(lang)
        setCode(STARTER_CODE[lang])
        setTraceData(null)
        setShowTrace(false)
    }

    const handleTrace = async () => {
        setIsTracing(true)
        setShowTrace(false)
        setTraceData(null)
        try {
        const res = await axios.post('http://127.0.0.1:8000/trace', {
            code,
            language,
            stdin: '',
        })
        setTraceData(res.data)
        setShowTrace(true)
        } catch (e) {
        setTraceData({
            frames: [],
            stdout: '',
            error: e?.response?.data?.detail || 'Failed to connect to trace server',
            total_steps: 0,
        })
        setShowTrace(true)
        } finally {
        setIsTracing(false)
        }
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

            <div className={styles.toolbarRight}>
            {['python', 'javascript'].includes(language) && (
                <button
                className={styles.traceBtn}
                onClick={handleTrace}
                disabled={isTracing || isSubmitting}
                title="Step through your code execution"
                >
                {isTracing
                    ? <><span className={styles.spinner} /> Tracing...</>
                    : <>⚡ Trace</>
                }
                </button>
            )}

            <button
                className={styles.submitBtn}
                onClick={() => onSubmit(code, language)}
                disabled={isSubmitting || isTracing}
            >
                {isSubmitting
                ? <><span className={styles.spinner} /> Judging...</>
                : <>Submit</>
                }
            </button>
            </div>
        </div>

        {/* Editor + Trace panel side by side */}
        <div className={styles.content}>
            <div className={styles.editorWrap} style={{ flex: showTrace ? '0 0 55%' : '1' }}>
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

            {showTrace && traceData && (
            <div className={styles.traceWrap}>
                <TracePanel
                frames={traceData.frames}
                totalSteps={traceData.total_steps}
                stdout={traceData.stdout}
                error={traceData.error}
                onClose={() => setShowTrace(false)}
                />
            </div>
            )}
        </div>

        {verdict && !showTrace && <VerdictPanel verdict={verdict} />}
        </div>
    )
    }

    function VerdictPanel({ verdict }) {
    const isAccepted = verdict.verdict === 'Accepted'
    const isError = ['Runtime Error', 'Time Limit Exceeded'].includes(verdict.verdict)

    return (
        <div className={styles.verdictPanel} data-status={isAccepted ? 'pass' : isError ? 'error' : 'fail'}>
        <div className={styles.verdictHeader}>
            <span className={styles.verdictIcon}>{isAccepted ? '✓' : isError ? '⚡' : '✗'}</span>
            <span className={styles.verdictTitle}>{verdict.verdict}</span>
            <span className={styles.verdictScore}>{verdict.passed}/{verdict.total} test cases</span>
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
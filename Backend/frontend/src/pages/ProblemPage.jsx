import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import ProblemPanel from '../components/ProblemPanel'
import EditorPanel from '../components/EditorPanel'
import { getProblems, submitSolution } from '../api'
import styles from './ProblemPage.module.css'

export default function ProblemPage({ theme, toggleTheme }) {
    const [problems, setProblems] = useState([])
    const [selectedProblem, setSelectedProblem] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [verdict, setVerdict] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        getProblems()
        .then(res => {
            setProblems(res.data)
            if (res.data.length > 0) setSelectedProblem(res.data[0])
        })
        .catch(() => setError('Could not connect to API. Is the server running?'))
    }, [])

    const handleSubmit = async (code, language) => {
        if (!selectedProblem) return
        setIsSubmitting(true)
        setVerdict(null)
        try {
        const res = await submitSolution(selectedProblem._id, language, code)
        setVerdict(res.data)
        } catch (e) {
        setVerdict({
            verdict: 'Runtime Error',
            passed: 0,
            total: 0,
            results: [{ test_case: 1, passed: false, error: e?.response?.data?.detail || 'Server error', expected: '', got: '' }],
        })
        } finally {
        setIsSubmitting(false)
        }
    }

    return (
        <div className={styles.page}>
        <Navbar theme={theme} toggleTheme={toggleTheme} />

        {error && (
            <div className={styles.errorBanner}>{error}</div>
        )}

        <div className={styles.body}>
            {/* Problem list sidebar */}
            <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>Problems</div>
            {problems.length === 0 && (
                <div className={styles.sidebarEmpty}>No problems yet.<br />Add one via POST /problems</div>
            )}
            {problems.map(p => (
                <button
                key={p._id}
                className={styles.problemItem}
                data-active={selectedProblem?._id === p._id}
                onClick={() => { setSelectedProblem(p); setVerdict(null) }}
                >
                <span className={styles.problemTitle}>{p.title}</span>
                <span className={styles.problemDiff} data-diff={p.difficulty}>{p.difficulty}</span>
                </button>
            ))}
            </aside>

            {/* Problem description */}
            <section className={styles.descPane}>
            <ProblemPanel problem={selectedProblem} />
            </section>

            {/* Code editor */}
            <section className={styles.editorPane}>
            <EditorPanel
                theme={theme}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                verdict={verdict}
            />
            </section>
        </div>
        </div>
    )
    }
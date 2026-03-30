    import styles from './ProblemPanel.module.css'

    const DIFFICULTY_COLOR = {
    Easy: 'green',
    Medium: 'amber',
    Hard: 'red',
    }

    export default function ProblemPanel({ problem }) {
    if (!problem) {
        return (
        <div className={styles.panel}>
            <div className={styles.empty}>Loading problem...</div>
        </div>
        )
    }

    const color = DIFFICULTY_COLOR[problem.difficulty] || 'accent'

    return (
        <div className={styles.panel}>
        <div className={styles.header}>
            <h1 className={styles.title}>{problem.title}</h1>
            <span className={styles.badge} data-color={color}>
            {problem.difficulty}
            </span>
        </div>

        <div className={styles.section}>
            <p className={styles.description}>{problem.description}</p>
        </div>

        {problem.sample_input && (
            <div className={styles.section}>
            <div className={styles.sectionLabel}>Example Input</div>
            <pre className={styles.codeBlock}>{problem.sample_input}</pre>
            </div>
        )}

        {problem.sample_output && (
            <div className={styles.section}>
            <div className={styles.sectionLabel}>Example Output</div>
            <pre className={styles.codeBlock}>{problem.sample_output}</pre>
            </div>
        )}
        </div>
    )
    }
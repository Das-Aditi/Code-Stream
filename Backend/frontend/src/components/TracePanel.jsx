    import { useState } from 'react'
    import styles from './TracePanel.module.css'

    export default function TracePanel({ frames, totalSteps, stdout, error, onClose }) {
    const [step, setStep] = useState(0)

    if (error && frames.length === 0) {
        return (
        <div className={styles.panel}>
            <div className={styles.header}>
            <span className={styles.title}>Execution Trace</span>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
            <div className={styles.errorBox}>{error}</div>
        </div>
        )
    }

    if (frames.length === 0) {
        return (
        <div className={styles.panel}>
            <div className={styles.header}>
            <span className={styles.title}>Execution Trace</span>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
            <div className={styles.empty}>No trace data available.</div>
        </div>
        )
    }

    const frame = frames[step]
    const prevFrame = step > 0 ? frames[step - 1] : null

    const prev = () => setStep(s => Math.max(0, s - 1))
    const next = () => setStep(s => Math.min(frames.length - 1, s + 1))

    // Detect which variables changed from previous frame
    const changedVars = new Set()
    if (prevFrame) {
        for (const key of Object.keys(frame.variables)) {
        if (JSON.stringify(frame.variables[key]) !== JSON.stringify(prevFrame.variables?.[key])) {
            changedVars.add(key)
        }
        }
    }

    return (
        <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
            <span className={styles.title}>Execution Trace</span>
            <div className={styles.headerRight}>
            <span className={styles.stepBadge}>
                Step {step + 1} / {frames.length}
            </span>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
        </div>

        {/* Current line info */}
        <div className={styles.lineInfo}>
            <span className={styles.lineLabel}>Line</span>
            <span className={styles.lineNum}>{frame.line}</span>
            <span className={styles.eventTag} data-event={frame.event}>{frame.event}</span>
            {frame.func && frame.func !== '<module>' && (
            <span className={styles.funcTag}>in {frame.func}()</span>
            )}
            {frame.return_value !== undefined && (
            <span className={styles.returnTag}>
                returns → {renderValue(frame.return_value)}
            </span>
            )}
        </div>

        {/* Variables */}
        <div className={styles.section}>
            <div className={styles.sectionLabel}>Variables</div>
            {Object.keys(frame.variables).length === 0 ? (
            <div className={styles.noVars}>No variables yet</div>
            ) : (
            <div className={styles.varList}>
                {Object.entries(frame.variables).map(([k, v]) => (
                <div
                    key={k}
                    className={styles.varRow}
                    data-changed={changedVars.has(k)}
                >
                    <span className={styles.varName}>{k}</span>
                    <span className={styles.varEquals}>=</span>
                    <span className={styles.varValue}>{renderValue(v)}</span>
                </div>
                ))}
            </div>
            )}
        </div>

        {/* Stdout so far */}
        <div className={styles.section}>
            <div className={styles.sectionLabel}>Output so far</div>
            <pre className={styles.stdout}>
            {frame.stdout || <span className={styles.noOutput}>nothing printed yet</span>}
            </pre>
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
            <button
            className={styles.navBtn}
            onClick={() => setStep(0)}
            disabled={step === 0}
            >
            ⏮ Start
            </button>
            <button
            className={styles.navBtn}
            onClick={prev}
            disabled={step === 0}
            >
            ← Prev
            </button>

            {/* Progress bar */}
            <div className={styles.progressWrap}>
            <div
                className={styles.progressBar}
                style={{ width: `${((step + 1) / frames.length) * 100}%` }}
            />
            </div>

            <button
            className={styles.navBtn}
            onClick={next}
            disabled={step === frames.length - 1}
            >
            Next →
            </button>
            <button
            className={styles.navBtn}
            onClick={() => setStep(frames.length - 1)}
            disabled={step === frames.length - 1}
            >
            End ⏭
            </button>
        </div>

        {error && (
            <div className={styles.errorBox} style={{ margin: '0 0 8px' }}>
            {error}
            </div>
        )}
        </div>
    )
    }


    function renderValue(val) {
    if (val === null || val === undefined) return <span className={styles.valNull}>None</span>
    if (typeof val === 'boolean') return <span className={styles.valBool}>{String(val)}</span>
    if (typeof val === 'number') return <span className={styles.valNum}>{val}</span>
    if (typeof val === 'string') return <span className={styles.valStr}>"{val}"</span>

    if (typeof val === 'object' && val.__type__) {
        if (val.__type__ === 'list' || val.__type__ === 'tuple') {
        const bracket = val.__type__ === 'list' ? ['[', ']'] : ['(', ')']
        return (
            <span className={styles.valList}>
            {bracket[0]}
            {val.items.map((item, i) => (
                <span key={i}>
                {renderValue(item)}
                {i < val.items.length - 1 && <span className={styles.comma}>, </span>}
                </span>
            ))}
            {val.length > 20 && <span className={styles.more}>...+{val.length - 20}</span>}
            {bracket[1]}
            <span className={styles.typeHint}> len={val.length}</span>
            </span>
        )
        }
        if (val.__type__ === 'dict') {
        return (
            <span className={styles.valDict}>
            {'{'}
            {Object.entries(val.items).map(([k, v], i, arr) => (
                <span key={k}>
                <span className={styles.valStr}>"{k}"</span>
                <span className={styles.comma}>: </span>
                {renderValue(v)}
                {i < arr.length - 1 && <span className={styles.comma}>, </span>}
                </span>
            ))}
            {val.length > 20 && <span className={styles.more}>...+{val.length - 20}</span>}
            {'}'}
            <span className={styles.typeHint}> len={val.length}</span>
            </span>
        )
        }
        if (val.__type__ === 'set') {
        return (
            <span className={styles.valList}>
            {'{'}{val.items.map((item, i) => (
                <span key={i}>{renderValue(item)}{i < val.items.length - 1 && ', '}</span>
            ))}{'}'}
            </span>
        )
        }
    }

    return <span className={styles.valStr}>{String(val)}</span>
    }
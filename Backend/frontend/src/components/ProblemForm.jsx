    import { useState } from 'react'
    import styles from './ProblemForm.module.css'

    const EMPTY_FORM = {
    title: '',
    description: '',
    difficulty: 'Easy',
    sample_input: '',
    sample_output: '',
    test_cases: [{ input: '', expected_output: '' }],
    }

    export default function ProblemForm({ initial, onSubmit, onCancel }) {
    const [form, setForm] = useState(() => {
        if (!initial) return EMPTY_FORM
        return {
        title: initial.title || '',
        description: initial.description || '',
        difficulty: initial.difficulty || 'Easy',
        sample_input: initial.sample_input || '',
        sample_output: initial.sample_output || '',
        test_cases: initial.test_cases?.length
            ? initial.test_cases
            : [{ input: '', expected_output: '' }],
        }
    })

    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState({})

    const set = (field, value) => {
        setForm(f => ({ ...f, [field]: value }))
        setErrors(e => ({ ...e, [field]: null }))
    }

    const setTestCase = (index, field, value) => {
        setForm(f => {
        const tc = [...f.test_cases]
        tc[index] = { ...tc[index], [field]: value }
        return { ...f, test_cases: tc }
        })
    }

    const addTestCase = () => {
        setForm(f => ({
        ...f,
        test_cases: [...f.test_cases, { input: '', expected_output: '' }],
        }))
    }

    const removeTestCase = (index) => {
        setForm(f => ({
        ...f,
        test_cases: f.test_cases.filter((_, i) => i !== index),
        }))
    }

    const validate = () => {
        const e = {}
        if (!form.title.trim()) e.title = 'Title is required'
        if (!form.description.trim()) e.description = 'Description is required'
        if (form.test_cases.length === 0) e.test_cases = 'Add at least one test case'
        form.test_cases.forEach((tc, i) => {
        if (!tc.expected_output.trim()) {
            e[`tc_${i}`] = 'Expected output is required'
        }
        })
        return e
    }

    const handleSubmit = async () => {
        const e = validate()
        if (Object.keys(e).length > 0) { setErrors(e); return }
        setSubmitting(true)
        await onSubmit(form)
        setSubmitting(false)
    }

    return (
        <div className={styles.form}>

        {/* Title */}
        <div className={styles.field}>
            <label className={styles.label}>Title <span className={styles.req}>*</span></label>
            <input
            className={styles.input}
            data-error={!!errors.title}
            placeholder="e.g. Two Sum"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            />
            {errors.title && <span className={styles.error}>{errors.title}</span>}
        </div>

        {/* Difficulty */}
        <div className={styles.field}>
            <label className={styles.label}>Difficulty <span className={styles.req}>*</span></label>
            <div className={styles.diffGroup}>
            {['Easy', 'Medium', 'Hard'].map(d => (
                <button
                key={d}
                type="button"
                className={styles.diffBtn}
                data-active={form.difficulty === d}
                data-diff={d}
                onClick={() => set('difficulty', d)}
                >
                {d}
                </button>
            ))}
            </div>
        </div>

        {/* Description */}
        <div className={styles.field}>
            <label className={styles.label}>Description <span className={styles.req}>*</span></label>
            <textarea
            className={styles.textarea}
            data-error={!!errors.description}
            placeholder="Describe the problem clearly..."
            rows={4}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            />
            {errors.description && <span className={styles.error}>{errors.description}</span>}
        </div>

        {/* Sample input/output */}
        <div className={styles.row}>
            <div className={styles.field}>
            <label className={styles.label}>Sample Input</label>
            <textarea
                className={styles.textarea}
                placeholder="3 5"
                rows={2}
                value={form.sample_input}
                onChange={e => set('sample_input', e.target.value)}
            />
            </div>
            <div className={styles.field}>
            <label className={styles.label}>Sample Output</label>
            <textarea
                className={styles.textarea}
                placeholder="8"
                rows={2}
                value={form.sample_output}
                onChange={e => set('sample_output', e.target.value)}
            />
            </div>
        </div>

        {/* Test cases */}
        <div className={styles.field}>
            <div className={styles.tcHeader}>
            <label className={styles.label}>
                Test Cases <span className={styles.req}>*</span>
                <span className={styles.tcCount}>{form.test_cases.length}</span>
            </label>
            </div>
            {errors.test_cases && <span className={styles.error}>{errors.test_cases}</span>}

            <div className={styles.tcList}>
            {form.test_cases.map((tc, i) => (
                <div key={i} className={styles.tcItem}>
                <div className={styles.tcIndex}>#{i + 1}</div>
                <div className={styles.tcFields}>
                    <div className={styles.tcField}>
                    <span className={styles.tcLabel}>Input</span>
                    <textarea
                        className={styles.tcInput}
                        placeholder="stdin input (leave empty if none)"
                        rows={2}
                        value={tc.input}
                        onChange={e => setTestCase(i, 'input', e.target.value)}
                    />
                    </div>
                    <div className={styles.tcField}>
                    <span className={styles.tcLabel}>Expected Output <span className={styles.req}>*</span></span>
                    <textarea
                        className={styles.tcInput}
                        data-error={!!errors[`tc_${i}`]}
                        placeholder="expected stdout"
                        rows={2}
                        value={tc.expected_output}
                        onChange={e => setTestCase(i, 'expected_output', e.target.value)}
                    />
                    {errors[`tc_${i}`] && <span className={styles.error}>{errors[`tc_${i}`]}</span>}
                    </div>
                </div>
                {form.test_cases.length > 1 && (
                    <button className={styles.removeTc} onClick={() => removeTestCase(i)}>✕</button>
                )}
                </div>
            ))}
            </div>

            <button className={styles.addTcBtn} onClick={addTestCase}>
            + Add Test Case
            </button>
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting
                ? <><span className={styles.spinner} /> Saving...</>
                : initial ? 'Save Changes' : 'Create Problem'
            }
            </button>
        </div>
        </div>
    )
    }
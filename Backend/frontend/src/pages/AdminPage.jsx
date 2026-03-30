    import { useState, useEffect } from 'react'
    import { getProblems, createProblem, updateProblem, deleteProblem } from '../api'
    import ProblemForm from '../components/ProblemForm'
    import styles from './AdminPage.module.css'

    export default function AdminPage({ onBack }) {
    const [problems, setProblems] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingProblem, setEditingProblem] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [toast, setToast] = useState(null)

    useEffect(() => {
        fetchProblems()
    }, [])

    const fetchProblems = async () => {
        setLoading(true)
        try {
        const res = await getProblems()
        setProblems(res.data)
        } catch {
        showToast('Failed to load problems', 'error')
        } finally {
        setLoading(false)
        }
    }

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleCreate = async (data) => {
        try {
        await createProblem(data)
        await fetchProblems()
        setShowForm(false)
        showToast('Problem created successfully')
        } catch {
        showToast('Failed to create problem', 'error')
        }
    }

    const handleUpdate = async (data) => {
        try {
        await updateProblem(editingProblem._id, data)
        await fetchProblems()
        setEditingProblem(null)
        showToast('Problem updated successfully')
        } catch {
        showToast('Failed to update problem', 'error')
        }
    }

    const handleDelete = async (id) => {
        try {
        await deleteProblem(id)
        await fetchProblems()
        setDeleteConfirm(null)
        showToast('Problem deleted')
        } catch {
        showToast('Failed to delete problem', 'error')
        }
    }

    const DIFF_COLOR = { Easy: 'green', Medium: 'amber', Hard: 'red' }

    return (
        <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
            <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={onBack}>← Back</button>
            <div>
                <h1 className={styles.title}>Problem Manager</h1>
                <p className={styles.subtitle}>{problems.length} problems in database</p>
            </div>
            </div>
            <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingProblem(null) }}>
            + New Problem
            </button>
        </div>

        {/* Problem list */}
        <div className={styles.body}>
            {loading ? (
            <div className={styles.empty}>Loading...</div>
            ) : problems.length === 0 ? (
            <div className={styles.empty}>
                No problems yet. Click <strong>+ New Problem</strong> to add one.
            </div>
            ) : (
            <div className={styles.table}>
                <div className={styles.tableHeader}>
                <span>Title</span>
                <span>Difficulty</span>
                <span>Test Cases</span>
                <span>Actions</span>
                </div>
                {problems.map(p => (
                <div key={p._id} className={styles.tableRow}>
                    <span className={styles.problemTitle}>{p.title}</span>
                    <span className={styles.badge} data-color={DIFF_COLOR[p.difficulty]}>
                    {p.difficulty}
                    </span>
                    <span className={styles.testCount}>
                    {p.test_cases?.length || 0} cases
                    </span>
                    <div className={styles.actions}>
                    <button
                        className={styles.editBtn}
                        onClick={() => { setEditingProblem(p); setShowForm(false) }}
                    >
                        Edit
                    </button>
                    <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteConfirm(p)}
                    >
                        Delete
                    </button>
                    </div>
                </div>
                ))}
            </div>
            )}
        </div>

        {/* Create form panel */}
        {showForm && (
            <SidePanel title="New Problem" onClose={() => setShowForm(false)}>
            <ProblemForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
            />
            </SidePanel>
        )}

        {/* Edit form panel */}
        {editingProblem && (
            <SidePanel title="Edit Problem" onClose={() => setEditingProblem(null)}>
            <ProblemForm
                initial={editingProblem}
                onSubmit={handleUpdate}
                onCancel={() => setEditingProblem(null)}
            />
            </SidePanel>
        )}

        {/* Delete confirmation */}
        {deleteConfirm && (
            <div className={styles.overlay}>
            <div className={styles.dialog}>
                <h2 className={styles.dialogTitle}>Delete Problem?</h2>
                <p className={styles.dialogBody}>
                "<strong>{deleteConfirm.title}</strong>" will be permanently deleted.
                </p>
                <div className={styles.dialogActions}>
                <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                    Cancel
                </button>
                <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteConfirm._id)}>
                    Delete
                </button>
                </div>
            </div>
            </div>
        )}

        {/* Toast */}
        {toast && (
            <div className={styles.toast} data-type={toast.type}>
            {toast.message}
            </div>
        )}
        </div>
    )
    }

    function SidePanel({ title, onClose, children }) {
    return (
        <div className={styles.sidePanelOverlay} onClick={onClose}>
        <div className={styles.sidePanel} onClick={e => e.stopPropagation()}>
            <div className={styles.sidePanelHeader}>
            <h2 className={styles.sidePanelTitle}>{title}</h2>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
            <div className={styles.sidePanelBody}>
            {children}
            </div>
        </div>
        </div>
    )
    }
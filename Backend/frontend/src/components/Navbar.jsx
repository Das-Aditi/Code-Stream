import styles from './Navbar.module.css'

export default function Navbar({ theme, toggleTheme }) {
return (
<nav className={styles.navbar}>
    <div className={styles.logo}>
    <span className={styles.logoMark}>{'</>'}</span>
    <span className={styles.logoText}>CodeStream</span>
    </div>

    <div className={styles.right}>
    <button className={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀' : '☾'}
    </button>
    </div>
</nav>
)
}
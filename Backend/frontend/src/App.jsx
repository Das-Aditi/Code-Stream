import { useState } from 'react'
import ProblemPage from './pages/ProblemPage'
import './index.css'

export default function App() {
  const [theme, setTheme] = useState('dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ProblemPage theme={theme} toggleTheme={toggleTheme} />
    </div>
  )
}
import { useState } from 'react'
import { SessionProvider, useSession } from './lib/SessionContext'
import ConfigBar from './components/ConfigBar'
import Register from './pages/Register'
import CompleteProfile from './pages/CompleteProfile'
import WriteReview from './pages/WriteReview'
import Checkout from './pages/Checkout'
import ProfilePage from './pages/ProfilePage'

const PAGES = [
  { id: 'register', label: 'Register', step: '1' },
  { id: 'profile-complete', label: 'Complete Profile', step: '2' },
  { id: 'review', label: 'Write a Review', step: '3' },
  { id: 'checkout', label: 'Checkout', step: '4' },
  { id: 'profile-page', label: 'My Profile', step: '5' },
]

function Inner() {
  const [page, setPage] = useState('register')
  const { customerId } = useSession()

  const renderPage = () => {
    switch (page) {
      case 'register': return <Register />
      case 'profile-complete': return <CompleteProfile />
      case 'review': return <WriteReview />
      case 'checkout': return <Checkout />
      case 'profile-page': return <ProfilePage />
      default: return <Register />
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          UrbanThreads
          <span>Gameball Demo</span>
        </div>
        {PAGES.map(p => (
          <button
            key={p.id}
            className={`nav-link ${page === p.id ? 'active' : ''}`}
            onClick={() => setPage(p.id)}
          >
            <span className="nav-step">{p.step}</span>
            {p.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', fontSize: 12, color: 'var(--text-hint)', borderTop: '0.5px solid var(--border)', paddingTop: '1rem' }}>
          {customerId
            ? <span>Session active</span>
            : <span>Start with step 1 to begin a session</span>
          }
        </div>
      </aside>
      <main className="main">
        <ConfigBar />
        {renderPage()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <Inner />
    </SessionProvider>
  )
}

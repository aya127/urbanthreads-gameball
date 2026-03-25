import { useState } from 'react'
import { useSession } from '../lib/SessionContext'
import StatusBanner from '../components/StatusBanner'

export default function Login() {
  const { setCustomerId, setCustomerName } = useSession()
  const [customerId, setInput] = useState('')
  const [status, setStatus] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!customerId.trim()) return setStatus({ type: 'error', message: 'Customer ID is required.' })

    setCustomerId(customerId.trim())
    setCustomerName(null)
    setStatus({ type: 'success', message: `Session switched to customer: ${customerId.trim()}` })
  }

  return (
    <div>
      <div className="page-header">
        <h1>Switch session</h1>
        <p>
          This is not a real login page. Enter any customer ID to switch the active session —
          all subsequent steps will run against that customer in Gameball.
        </p>
      </div>

      <div className="card">
        <div className="card-title">Switch active customer</div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Customer ID</label>
            <input placeholder="UT_..." value={customerId} onChange={e => setInput(e.target.value)} />
          </div>
          <button className="btn btn-primary" type="submit">Switch session →</button>
        </form>
        <StatusBanner status={status} />
      </div>
    </div>
  )
}

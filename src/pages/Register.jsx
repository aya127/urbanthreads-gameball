import { useState } from 'react'
import { useSession } from '../lib/SessionContext'
import { createOrUpdateCustomer } from '../lib/gameball'
import StatusBanner from '../components/StatusBanner'
import ApiHint from '../components/ApiHint'

export default function Register() {
  const { setCustomerId, setCustomerName, keys } = useSession()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.firstName || !form.email) {
      return setStatus({ type: 'error', message: 'First name and email are required.' })
    }
    setLoading(true)
    setStatus({ type: 'loading', message: 'Registering with Gameball...' })
    try {
      const customerId = 'UT_' + crypto.randomUUID()
      await createOrUpdateCustomer({
        customerId,
        customerAttributes: {
          displayName: `${form.firstName} ${form.lastName}`.trim(),
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          joinDate: new Date().toISOString(),
        }
      }, keys)

      // persist so the user can log in again later
      const stored = JSON.parse(localStorage.getItem('gb_customers') || '{}')
      stored[form.email] = { customerId, firstName: form.firstName }
      localStorage.setItem('gb_customers', JSON.stringify(stored))

      setCustomerId(customerId)
      setCustomerName(form.firstName)
      setStatus({
        type: 'success',
        message: `Account created! Your customer ID is ${customerId} — proceed to step 2 to complete your profile.`
      })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Create your account</h1>
        <p>New to UrbanThreads? Sign up and join the loyalty program.</p>
      </div>

      <div className="card">
        <div className="card-title">Registration</div>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="field">
              <label>First name</label>
              <input placeholder="Arya" value={form.firstName} onChange={set('firstName')} />
            </div>
            <div className="field">
              <label>Last name</label>
              <input placeholder="Stark" value={form.lastName} onChange={set('lastName')} />
            </div>
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="arya@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account →'}
          </button>
        </form>
        <StatusBanner status={status} />
        <ApiHint lines={['POST /api/v4.0/integrations/customers']} />
      </div>
    </div>
  )
}

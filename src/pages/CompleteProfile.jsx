import { useState } from 'react'
import { useSession } from '../lib/SessionContext'
import { createOrUpdateCustomer, sendEvent } from '../lib/gameball'
import StatusBanner from '../components/StatusBanner'
import ApiHint from '../components/ApiHint'

export default function CompleteProfile() {
  const { customerId, keys } = useSession()
  const [form, setForm] = useState({ phone: '', dob: '', gender: '' })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerId) return setStatus({ type: 'error', message: 'Complete step 1 (Register) first.' })

    setLoading(true)
    setStatus({ type: 'loading', message: 'Updating profile and sending event...' })

    try {
      // Update customer attributes
      const attrs = {}
      if (form.phone) attrs.mobile = form.phone
      if (form.dob) attrs.dateOfBirth = new Date(form.dob).toISOString()
      if (form.gender) attrs.gender = form.gender

      await createOrUpdateCustomer({ customerId, customerAttributes: attrs }, keys)

      // Send profile_completed event
      await sendEvent({
        customerId,
        events: {
          profile_completed: {
            has_phone: !!form.phone,
            has_dob: !!form.dob,
            has_gender: !!form.gender,
          }
        }
      }, keys)

      setStatus({ type: 'success', message: 'Profile saved.' })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Complete your profile</h1>
        <p>Add more details to earn the "Profile Completed" badge.</p>
      </div>

      <div className="card">
        <div className="card-title">Profile details</div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Phone number</label>
            <input placeholder="+201001234567" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="row">
            <div className="field">
              <label>Date of birth</label>
              <input type="date" value={form.dob} onChange={set('dob')} />
            </div>
            <div className="field">
              <label>Gender</label>
              <select value={form.gender} onChange={set('gender')}>
                <option value="">Prefer not to say</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save profile →'}
          </button>
        </form>
        <StatusBanner status={status} />
        <ApiHint lines={[
          'POST /api/v4.0/integrations/customers  (update attributes)',
          'POST /api/v4.0/integrations/events  (profile_completed event)'
        ]} />
      </div>
    </div>
  )
}

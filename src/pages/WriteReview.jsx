import { useState } from 'react'
import { useSession } from '../lib/SessionContext'
import { sendEvent } from '../lib/gameball'
import StatusBanner from '../components/StatusBanner'
import ApiHint from '../components/ApiHint'

const PRODUCTS = [
  { id: 'PROD001', name: 'Classic White Tee', price: 29 },
  { id: 'PROD002', name: 'Slim Fit Chinos', price: 59 },
  { id: 'PROD003', name: 'Linen Overshirt', price: 79 },
  { id: 'PROD004', name: 'Stripe Polo Shirt', price: 45 },
  { id: 'PROD005', name: 'Denim Jacket', price: 99 },
]

export default function WriteReview() {
  const { customerId, keys } = useSession()
  const [form, setForm] = useState({ productId: 'PROD001', rating: '5', review: '', hasImage: false })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerId) return setStatus({ type: 'error', message: 'Complete step 1 (Register) first.' })

    setLoading(true)
    setStatus({ type: 'loading', message: 'Sending write_review event to Gameball...' })

    try {
      await sendEvent({
        customerId,
        events: {
          write_review: {
            product_id: form.productId,
            rating: parseInt(form.rating),
            has_image: form.hasImage,
            review_length: form.review.length,
          }
        }
      }, keys)

      setStatus({
        type: 'success',
        message: `Review submitted! Event sent with has_image: ${form.hasImage}. Gameball will trigger any matching reward campaigns.`
      })
      setForm(f => ({ ...f, review: '', hasImage: false }))
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Write a review</h1>
        <p>Share your thoughts on a product you purchased.</p>
      </div>

      <div className="card">
        <div className="card-title">Product review</div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Product</label>
            <select value={form.productId} onChange={set('productId')}>
              {PRODUCTS.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Rating</label>
            <select value={form.rating} onChange={set('rating')}>
              <option value="5">⭐⭐⭐⭐⭐ — Excellent</option>
              <option value="4">⭐⭐⭐⭐ — Good</option>
              <option value="3">⭐⭐⭐ — Average</option>
              <option value="2">⭐⭐ — Poor</option>
              <option value="1">⭐ — Terrible</option>
            </select>
          </div>
          <div className="field">
            <label>Your review</label>
            <textarea
              placeholder="Share your honest thoughts about this product..."
              value={form.review}
              onChange={set('review')}
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.hasImage}
              onChange={e => setForm(f => ({ ...f, hasImage: e.target.checked }))}
            />
            I'm attaching a photo with this review
          </label>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-hint)' }}>
            Note: reviews with photos (<code>has_image: true</code>) can trigger a separate reward campaign in Gameball.
          </div>
          <button className="btn btn-primary" type="submit" style={{ marginTop: 14 }} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit review →'}
          </button>
        </form>
        <StatusBanner status={status} />
        <ApiHint lines={[
          'POST /api/v4.0/integrations/events',
          'Event: write_review { product_id, rating, has_image, review_length }'
        ]} />
      </div>
    </div>
  )
}

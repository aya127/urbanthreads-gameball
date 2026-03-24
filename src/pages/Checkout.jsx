import { useState, useEffect } from 'react'
import { useSession } from '../lib/SessionContext'
import { getPointsBalance, holdPoints as holdPointsApi, placeOrder as placeOrderApi } from '../lib/gameball'
import StatusBanner from '../components/StatusBanner'
import ApiHint from '../components/ApiHint'

const PRODUCTS = [
  { id: 'PROD001', name: 'Classic White Tee', price: 29, emoji: '👕' },
  { id: 'PROD002', name: 'Slim Fit Chinos', price: 59, emoji: '👖' },
  { id: 'PROD003', name: 'Linen Overshirt', price: 79, emoji: '🧥' },
]

export default function Checkout() {
  const { customerId, keys, holdReference, setHoldReference } = useSession()
  const [selected, setSelected] = useState({ PROD001: PRODUCTS[0] })
  const [redeemAmount, setRedeemAmount] = useState('')
  const [pointsBalance, setPointsBalance] = useState(null)
  const [statusHold, setStatusHold] = useState(null)
  const [statusOrder, setStatusOrder] = useState(null)
  const [loadingHold, setLoadingHold] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(false)

  const total = Object.values(selected).reduce((s, p) => s + p.price, 0)

  useEffect(() => {
    if (customerId && keys.apiKey) fetchBalance()
  }, [customerId])

  async function fetchBalance() {
    try {
      const data = await getPointsBalance(customerId, keys)
      setPointsBalance(data.availablePointsBalance ?? data.pointsBalance ?? 0)
    } catch { setPointsBalance('—') }
  }

  function toggleProduct(p) {
    setSelected(s => {
      const next = { ...s }
      if (next[p.id]) delete next[p.id]
      else next[p.id] = p
      return next
    })
  }

  async function handleHoldPoints() {
    if (!customerId) return setStatusHold({ type: 'error', message: 'Complete step 1 first.' })
    const amount = parseFloat(redeemAmount)
    if (!amount || amount <= 0) return setStatusHold({ type: 'error', message: 'Enter a valid redemption amount.' })

    setLoadingHold(true)
    setStatusHold({ type: 'loading', message: 'Holding points — reserving for checkout...' })
    try {
      const data = await holdPointsApi({ customerId, amount }, keys)
      setHoldReference(data.holdReference)
      setStatusHold({
        type: 'success',
        message: `Points held! holdReference: ${data.holdReference} (expires in 10 min). Now place your order.`
      })
    } catch (err) {
      setStatusHold({ type: 'error', message: err.message })
    } finally {
      setLoadingHold(false)
    }
  }

  async function handlePlaceOrder() {
    if (!customerId) return setStatusOrder({ type: 'error', message: 'Complete step 1 first.' })
    const prods = Object.values(selected)
    if (!prods.length) return setStatusOrder({ type: 'error', message: 'Select at least one product.' })

    setLoadingOrder(true)
    setStatusOrder({ type: 'loading', message: 'Placing order with Gameball...' })
    try {
      const redeem = parseFloat(redeemAmount) || 0
      const totalPaid = Math.max(0, total - (holdReference ? redeem : 0))
      const orderId = 'ORD_' + Date.now()

      const body = {
        customerId,
        orderId,
        orderDate: new Date().toISOString(),
        totalPaid,
        totalPrice: total,
        totalDiscount: holdReference ? redeem : 0,
        lineItems: prods.map(p => ({
          productId: p.id,
          title: p.name,
          price: p.price,
          quantity: 1,
          category: ['clothing'],
        })),
      }

      if (holdReference) {
        body.redemption = { pointsHoldReference: holdReference }
      }

      await placeOrderApi(body, keys)
      setHoldReference(null)
      setRedeemAmount('')
      setStatusHold(null)
      setStatusOrder({
        type: 'success',
        message: `Order ${orderId} placed! You paid $${totalPaid}. Points will be awarded based on this amount.`
      })
      setTimeout(fetchBalance, 1500)
    } catch (err) {
      setStatusOrder({ type: 'error', message: err.message })
    } finally {
      setLoadingOrder(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Earn points on your order and optionally redeem points for a discount.</p>
      </div>

      <div className="card">
        <div className="card-title">Select items</div>
        <div className="product-grid">
          {PRODUCTS.map(p => (
            <div
              key={p.id}
              className={`product-card ${selected[p.id] ? 'selected' : ''}`}
              onClick={() => toggleProduct(p)}
            >
              <div className="product-emoji">{p.emoji}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-price">${p.price}</div>
            </div>
          ))}
        </div>

        <hr className="divider" />

        <div className="metrics-grid">
          <div className="metric">
            <div className="metric-label">Order total</div>
            <div className="metric-value">${total}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Points balance</div>
            <div className="metric-value">{pointsBalance !== null ? `${pointsBalance} pts` : '—'}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Hold reference</div>
            <div className="metric-value" style={{ fontSize: 13, paddingTop: 4 }}>
              {holdReference ? <span style={{ color: 'var(--success-text)' }}>Active ✓</span> : 'None'}
            </div>
          </div>
        </div>

        <button className="btn btn-sm" onClick={fetchBalance} style={{ marginBottom: 0 }}>
          ↻ Refresh balance
        </button>

        <hr className="divider" />

        <div className="card-title">Redeem points (optional)</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Enter a dollar amount to redeem. This calls the Hold API to reserve points before checkout.
        </p>
        <div className="redeem-row">
          <span style={{ fontSize: 13, whiteSpace: 'nowrap' }}>Redeem $</span>
          <input
            type="number" min="0" step="1"
            placeholder="0"
            value={redeemAmount}
            onChange={e => setRedeemAmount(e.target.value)}
            style={{ width: 100 }}
          />
          <button className="btn btn-sm" onClick={handleHoldPoints} disabled={loadingHold}>
            {loadingHold ? 'Holding...' : 'Hold points'}
          </button>
        </div>
        <StatusBanner status={statusHold} />

        <hr className="divider" />

        <div className="card-title">Place order</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Places the order and awards cashback points on the amount paid.
          If a hold reference exists, it will be redeemed in the same call.
        </p>
        <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={loadingOrder}>
          {loadingOrder ? 'Placing order...' : 'Place order & earn points →'}
        </button>
        <StatusBanner status={statusOrder} />

        <ApiHint lines={[
          'GET  /api/v4.0/integrations/customers/{id}/points',
          'POST /api/v4.0/integrations/transactions/hold',
          'POST /api/v4.0/integrations/orders  (earn + redeem in one call)',
        ]} />
      </div>
    </div>
  )
}

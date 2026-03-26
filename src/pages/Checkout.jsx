import { useState, useEffect } from 'react'
import { useSession } from '../lib/SessionContext'
import { getCustomerBalance, holdPoints as holdPointsApi, unholdPoints as unholdPointsApi, placeOrder as placeOrderApi, calculateOrderCashback } from '../lib/gameball'
import StatusBanner from '../components/StatusBanner'

const PRODUCTS = [
  { id: 'PROD001', name: 'Classic White Tee', price: 29, emoji: '👕' },
  { id: 'PROD002', name: 'Slim Fit Chinos', price: 59, emoji: '👖' },
  { id: 'PROD003', name: 'Linen Overshirt', price: 79, emoji: '🧥' },
]

const SHIPPING_RATES = { cairo: 5, giza: 6 }

export default function Checkout() {
  const { customerId, keys, holdReference, setHoldReference } = useSession()
  const [selected, setSelected] = useState({ PROD001: PRODUCTS[0] })
  const [city, setCity] = useState('')
  const [balance, setBalance] = useState(null)
  const [statusHold, setStatusHold] = useState(null)
  const [statusOrder, setStatusOrder] = useState(null)
  const [loadingHold, setLoadingHold] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [earnPreview, setEarnPreview] = useState(null)
  const [heldAmount, setHeldAmount] = useState(0)

  const subtotal = Object.values(selected).reduce((s, p) => s + p.price, 0)
  const shipping = city ? (SHIPPING_RATES[city] ?? 0) : 0
  const total = subtotal + shipping
  const totalDiscount = holdReference ? heldAmount : 0
  const totalPaid = Math.max(0, total - totalDiscount)

  useEffect(() => {
    if (customerId && keys.apiKey) fetchBalance()
  }, [customerId])

  useEffect(() => {
    if (!customerId || !keys.apiKey || !Object.keys(selected).length) return setEarnPreview(null)
    const prods = Object.values(selected)
    calculateOrderCashback({
      customerId,
      totalPaid,
      totalPrice: subtotal,
      totalDiscount,
      totalShipping: shipping,
      lineItems: prods.map(p => ({ productId: p.id, quantity: 1, price: p.price, category: ['clothing'] })),
    }, keys).then(data => setEarnPreview(data.totalPoints)).catch(() => setEarnPreview(null))
  }, [selected, holdReference, balance, city, totalPaid, totalDiscount])

  async function fetchBalance() {
    try {
      const data = await getCustomerBalance(customerId, keys)
      setBalance(data)
    } catch { setBalance(null) }
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
    const amount = balance?.avaliablePointsValue ?? 0
    if (!amount || amount <= 0) return setStatusHold({ type: 'error', message: 'No points available for redemption.' })

    setLoadingHold(true)
    setStatusHold({ type: 'loading', message: 'Holding points — reserving for checkout...' })
    try {
      const data = await holdPointsApi({
        customerId,
        transactionTime: new Date().toISOString(),
        amountToHold: amount,
        ignoreOTP: true,
      }, keys)
      setHoldReference(data.holdReference)
      setHeldAmount(amount)
      setStatusHold({ type: 'success', message: `Discount applied.` })
    } catch (err) {
      setStatusHold({ type: 'error', message: err.message })
    } finally {
      setLoadingHold(false)
    }
  }

  async function handleUnholdPoints() {
    if (!holdReference) return
    setLoadingHold(true)
    try {
      await unholdPointsApi(holdReference, keys)
      setHoldReference(null)
      setHeldAmount(0)
      setStatusHold(null)
      fetchBalance()
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
    if (!city) return setStatusOrder({ type: 'error', message: 'Please select a city.' })

    setLoadingOrder(true)
    setStatusOrder({ type: 'loading', message: 'Placing order with Gameball...' })
    try {
      const orderId = 'ORD_' + Date.now()

      const body = {
        customerId,
        orderId,
        orderDate: new Date().toISOString(),
        totalPaid,
        totalPrice: subtotal,
        totalDiscount,
        totalShipping: shipping,
        lineItems: prods.map(p => ({
          productId: p.id,
          title: p.name,
          price: p.price,
          quantity: 1,
          category: ['clothing'],
        })),
      }

      if (holdReference && heldAmount > 0) {
        body.redemption = { pointsHoldReference: holdReference }
      }

      await placeOrderApi(body, keys)
      setHoldReference(null)
      setHeldAmount(0)
      setStatusHold(null)
      setStatusOrder({
        type: 'success',
        message: `Order ${orderId} placed! You paid $${totalPaid}. You'll earn ${earnPreview != null ? earnPreview + ' pts' : 'points'} on this order.`
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

        <div className="card-title">Shipping address</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.keys(SHIPPING_RATES).map(c => (
            <button
              key={c}
              className={`btn btn-sm ${city === c ? 'btn-primary' : ''}`}
              onClick={() => setCity(c)}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)} (${SHIPPING_RATES[c]})
            </button>
          ))}
        </div>

        <hr className="divider" />

        <div className="metrics-grid">
          <div className="metric">
            <div className="metric-label">Subtotal</div>
            <div className="metric-value">${subtotal}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Shipping</div>
            <div className="metric-value">{city ? `$${shipping}` : '—'}</div>
          </div>
          {totalDiscount > 0 && (
            <div className="metric">
              <div className="metric-label">Discount</div>
              <div className="metric-value" style={{ color: 'var(--success-text)' }}>-${totalDiscount}</div>
            </div>
          )}
          <div className="metric">
            <div className="metric-label">Total to pay</div>
            <div className="metric-value">${city ? totalPaid : `${subtotal - totalDiscount}+`}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Available points</div>
            <div className="metric-value">{balance ? `${balance.avaliablePointsBalance} pts` : '—'}</div>
          </div>
          {balance?.pendingPoints > 0 && (
            <div className="metric">
              <div className="metric-label">Pending points</div>
              <div className="metric-value" style={{ color: 'var(--text-muted)' }}>{balance.pendingPoints} pts</div>
            </div>
          )}
        </div>

        <hr className="divider" />

        <div className="card-title">Redeem points (optional)</div>
        {holdReference && heldAmount > 0 ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--success-text)', marginBottom: 12 }}>
              ✓ ${heldAmount} in points is held and will be applied at checkout.
            </p>
            <div className="redeem-row">
              <button className="btn btn-sm" onClick={handleUnholdPoints} disabled={loadingHold}>
                {loadingHold ? 'Cancelling...' : 'Cancel redemption'}
              </button>
            </div>
          </>
        ) : (
          <>
            {balance?.avaliablePointsValue > 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                Redeem your full available points balance (${balance.avaliablePointsValue}) as a discount.
              </p>
            )}
            <div className="redeem-row">
              <button className="btn btn-sm" onClick={handleHoldPoints} disabled={loadingHold || !balance?.avaliablePointsValue}>
                {loadingHold ? 'Holding...' : `Redeem $${balance?.avaliablePointsValue ?? 0}`}
              </button>
            </div>
          </>
        )}
        <StatusBanner status={statusHold} />

        <hr className="divider" />

        <div className="card-title">Place order</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Places the order and awards cashback points on the amount paid.
          If a hold reference exists, it will be redeemed in the same call.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={loadingOrder}>
            {loadingOrder ? 'Placing order...' : 'Place order & earn points →'}
          </button>
          {earnPreview != null && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>+{earnPreview} pts</span>
          )}
        </div>
        <StatusBanner status={statusOrder} />

      </div>
    </div>
  )
}

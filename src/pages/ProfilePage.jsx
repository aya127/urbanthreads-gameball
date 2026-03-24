import { useState } from 'react'
import { useSession } from '../lib/SessionContext'
import { getPointsBalance, getCustomerTier, getCustomerCampaigns } from '../lib/gameball'
import StatusBanner from '../components/StatusBanner'
import ApiHint from '../components/ApiHint'

const BADGE_ICONS = ['⭐', '🏆', '🎯', '💎', '🔥', '🎖️', '🥇', '🏅', '🎪', '🚀']

function TierPill({ name }) {
  const lower = (name || '').toLowerCase()
  const cls = lower.includes('gold') ? 'tier-gold' : lower.includes('silver') ? 'tier-silver' : lower.includes('bronze') ? 'tier-bronze' : 'tier-basic'
  return <span className={`tier-pill ${cls}`}>{name || 'Basic'}</span>
}

export default function ProfilePage() {
  const { customerId, customerName, keys } = useSession()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadProfile() {
    if (!customerId) return setStatus({ type: 'error', message: 'Complete step 1 (Register) first.' })
    setLoading(true)
    setStatus({ type: 'loading', message: 'Fetching profile data from Gameball...' })
    try {
      const [pointsData, tierData, campaignsData] = await Promise.all([
        getPointsBalance(customerId, keys),
        getCustomerTier(customerId, keys),
        getCustomerCampaigns(customerId, keys),
      ])

      const campaigns = campaignsData.campaigns ?? campaignsData ?? []
      setData({ pointsData, tierData, campaigns })
      setStatus({ type: 'success', message: 'Profile loaded successfully.' })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const tierName = data?.tierData?.currentTier?.name ?? data?.tierData?.name ?? 'Basic'
  const progress = data?.tierData?.currentProgress ?? data?.tierData?.progress ?? 0
  const nextMin = data?.tierData?.nextTier?.minProgress ?? data?.tierData?.minProgress ?? 0
  const pct = nextMin > 0 ? Math.min(100, Math.round((progress / nextMin) * 100)) : 100

  return (
    <div>
      <div className="page-header">
        <h1>Loyalty profile</h1>
        <p>View points balance, VIP tier, and earned badges.</p>
      </div>

      <button className="btn btn-primary" onClick={loadProfile} disabled={loading} style={{ marginBottom: '1rem' }}>
        {loading ? 'Loading...' : 'Load profile data →'}
      </button>
      <StatusBanner status={status} />

      {data && (
        <>
          <div className="metrics-grid" style={{ marginTop: '1rem' }}>
            <div className="metric">
              <div className="metric-label">Points balance</div>
              <div className="metric-value">{data.pointsData.availablePointsBalance ?? '—'} pts</div>
            </div>
            <div className="metric">
              <div className="metric-label">Pending points</div>
              <div className="metric-value">{data.pointsData.pendingPointsBalance ?? '0'} pts</div>
            </div>
            <div className="metric">
              <div className="metric-label">Redeemable value</div>
              <div className="metric-value">${data.pointsData.availablePointsValue ?? data.pointsData.redeemablePointsValue ?? '—'}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Current tier</div>
              <div className="metric-value" style={{ fontSize: 16, paddingTop: 4 }}><TierPill name={tierName} /></div>
            </div>
          </div>

          {nextMin > 0 && (
            <div className="card">
              <div className="card-title">Tier progress</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>{progress} progress points earned</span>
                <span>{nextMin} needed for next tier</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>{pct}% to next tier</div>
            </div>
          )}

          <div className="card">
            <div className="card-title">Badges & achievements</div>
            {data.campaigns.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No reward campaigns configured yet. Set up campaigns in your Gameball dashboard to see badges here.
              </p>
            ) : (
              <div className="badge-grid">
                {data.campaigns.slice(0, 10).map((c, i) => {
                  const earned = c.completed || c.isUnlocked
                  const pctDone = c.completionPercentage ?? (earned ? 100 : 0)
                  return (
                    <div key={i} className={`badge-item ${earned ? 'earned' : ''}`}>
                      <div className="badge-icon">{BADGE_ICONS[i % BADGE_ICONS.length]}</div>
                      <div className="badge-name">{c.name ?? 'Achievement'}</div>
                      <div className="badge-desc">
                        {earned ? 'Earned ✓' : `${Math.round(pctDone)}% complete`}
                      </div>
                      {!earned && (
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.round(pctDone)}%` }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <ApiHint lines={[
            `GET /api/v4.0/integrations/customers/${customerId}/points`,
            `GET /api/v4.0/integrations/customers/${customerId}/tier`,
            `GET /api/v4.0/integrations/customers/${customerId}/campaigns`,
          ]} />
        </>
      )}
    </div>
  )
}

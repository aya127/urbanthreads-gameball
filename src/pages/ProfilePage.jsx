import { useState, useEffect } from 'react'
import { useSession } from '../lib/SessionContext'
import { getCustomerBalance, getCustomerTier, getCustomerCampaigns } from '../lib/gameball'

function TierPill({ name }) {
  const lower = (name || '').toLowerCase()
  const cls = lower.includes('gold') ? 'tier-gold' : lower.includes('silver') ? 'tier-silver' : lower.includes('bronze') ? 'tier-bronze' : 'tier-basic'
  return <span className={`tier-pill ${cls}`}>{name || 'Basic'}</span>
}

function BadgeCard({ campaign }) {
  const earned = campaign.achievedCount > 0
  const pct = Math.round(campaign.completionPercentage ?? 0)
  const icon = campaign.rewardCampaignConfiguration?.icon
  const description = campaign.rewardCampaignConfiguration?.description
  const reward = campaign.rewardCampaignConfiguration?.rewards?.[0]?.walletReward

  return (
    <div className={`badge-item ${earned ? 'earned' : ''}`}>
      {icon
        ? <img src={icon} alt="" style={{ width: 32, height: 32, marginBottom: 6, opacity: earned ? 1 : 0.35 }} />
        : <div className="badge-icon" style={{ opacity: earned ? 1 : 0.35 }}>🎖️</div>
      }
      <div className="badge-name">{campaign.rewardsCampaignName ?? 'Achievement'}</div>
      {description && <div className="badge-desc" style={{ marginTop: 3 }}>{description}</div>}
      {reward > 0 && (
        <div style={{ fontSize: 11, color: earned ? 'var(--success-text)' : 'var(--text-hint)', marginTop: 4 }}>
          +{reward} pts
        </div>
      )}
      <div className="badge-desc" style={{ marginTop: 4 }}>
        {earned ? `Achieved ✓ (×${campaign.achievedCount})` : `${pct}% complete`}
      </div>
      {!earned && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { customerId, customerName, keys } = useSession()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (customerId && keys.apiKey) loadProfile()
    else setData(null)
  }, [customerId])

  async function loadProfile() {
    setLoading(true)
    setError(null)
    try {
      const [pointsData, tierData, campaignsData] = await Promise.all([
        getCustomerBalance(customerId, keys),
        getCustomerTier(customerId, keys),
        getCustomerCampaigns(customerId, keys),
      ])
      const campaigns = campaignsData.campaigns ?? campaignsData ?? []
      setData({ pointsData, tierData, campaigns })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tierName = data?.tierData?.current?.name ?? 'Basic'
  const nextTierName = data?.tierData?.next?.name ?? null
  const progress = data?.tierData?.progress ?? 0
  const nextMin = data?.tierData?.next?.minPorgress ?? 0
  const pct = nextMin > 0 ? Math.min(100, Math.round((progress / nextMin) * 100)) : 100

  const achieved = data?.campaigns.filter(c => c.achievedCount > 0) ?? []
  const inProgress = data?.campaigns.filter(c => !(c.achievedCount > 0)) ?? []

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>My Profile</h1>
          <p>Points balance, VIP tier, and badge achievements.</p>
        </div>
        {data && (
          <button className="btn btn-sm" onClick={loadProfile} disabled={loading}>
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        )}
      </div>

      {!customerId && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Complete step 1 (Register) to view your profile.</p>
        </div>
      )}

      {loading && !data && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading profile...</p>
        </div>
      )}

      {error && (
        <div className="status status-error">{error}</div>
      )}

      {data && (
        <>
          {/* Points & Tier */}
          <div className="card">
            <div className="card-title">Points & Tier</div>
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-label">Points balance</div>
                <div className="metric-value">{data.pointsData.avaliablePointsBalance ?? '—'} pts</div>
              </div>
              <div className="metric">
                <div className="metric-label">Redeemable value</div>
                <div className="metric-value">${data.pointsData.avaliablePointsValue ?? '—'}</div>
              </div>
              {data.pointsData.pendingPoints > 0 && (
                <div className="metric">
                  <div className="metric-label">Pending points</div>
                  <div className="metric-value" style={{ color: 'var(--text-muted)' }}>{data.pointsData.pendingPoints} pts</div>
                </div>
              )}
              <div className="metric">
                <div className="metric-label">VIP tier</div>
                <div className="metric-value" style={{ fontSize: 16, paddingTop: 4 }}>
                  <TierPill name={tierName} />
                </div>
              </div>
            </div>

            {nextMin > 0 && nextTierName && (
              <>
                <hr className="divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Progress to <strong>{nextTierName}</strong></span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{progress} / {nextMin} pts</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-hint)', marginTop: 6 }}>{nextMin - progress} pts to go</div>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="card">
            <div className="card-title">Badges & Achievements</div>

            {data.campaigns.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                No reward campaigns configured yet. Set up campaigns in your Gameball dashboard.
              </p>
            ) : (
              <>
                {achieved.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                      Achieved ({achieved.length})
                    </div>
                    <div className="badge-grid" style={{ marginBottom: inProgress.length > 0 ? '1.5rem' : 0 }}>
                      {achieved.map((c, i) => (
                        <BadgeCard key={i} campaign={c} />
                      ))}
                    </div>
                  </>
                )}

                {inProgress.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-hint)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                      Not yet achieved ({inProgress.length})
                    </div>
                    <div className="badge-grid">
                      {inProgress.map((c, i) => (
                        <BadgeCard key={i} campaign={c} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

        </>
      )}
    </div>
  )
}

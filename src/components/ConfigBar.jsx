import { useSession } from '../lib/SessionContext'

export default function ConfigBar() {
  const { apiKey, setApiKey, secretKey, setSecretKey, customerId, customerName } = useSession()
  const connected = !!apiKey

  return (
    <div className="config-bar">
      <div className="config-bar-title">
        <div className={`dot ${connected ? 'connected' : ''}`} />
        {connected ? 'Gameball connected' : 'Connect Gameball — enter your API keys'}
      </div>
      <div className="config-fields">
        <input
          placeholder="API Key"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <input
          placeholder="Secret Key (for orders & redemption)"
          type="password"
          value={secretKey}
          onChange={e => setSecretKey(e.target.value)}
        />
      </div>
      {customerId && (
        <div className="session-pill">
          <div className="dot" />
          Logged in as {customerName || customerId} &nbsp;·&nbsp; ID: <strong>{customerId}</strong>
        </div>
      )}
    </div>
  )
}

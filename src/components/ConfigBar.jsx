import { useSession } from '../lib/SessionContext'

export default function ConfigBar() {
  const { customerId, customerName } = useSession()

  return (
    <div className="config-bar">
      {customerId && (
        <div className="session-pill">
          <div className="dot" />
          Logged in as {customerName || customerId} &nbsp;·&nbsp; ID: <strong>{customerId}</strong>
        </div>
      )}
    </div>
  )
}

export default function StatusBanner({ status }) {
  if (!status) return null
  const cls = status.type === 'success' ? 'status-success' : status.type === 'error' ? 'status-error' : 'status-loading'
  return <div className={`status ${cls}`}>{status.message}</div>
}

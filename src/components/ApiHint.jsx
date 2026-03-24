export default function ApiHint({ lines }) {
  return (
    <div className="api-hint">
      <strong>API call{lines.length > 1 ? 's' : ''}:</strong>
      <ul style={{ marginTop: 4, paddingLeft: 16 }}>
        {lines.map((l, i) => <li key={i} style={{ marginTop: 2 }}><code>{l}</code></li>)}
      </ul>
    </div>
  )
}

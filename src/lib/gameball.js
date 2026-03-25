const BASE = 'https://api.gameball.co/api/v4.0/integrations'

export async function gameballRequest(method, path, body, { apiKey, secretKey } = {}, needSecret = false) {
  if (!apiKey) throw new Error('API Key is required. Set VITE_GAMEBALL_API_KEY in your .env file.')
  if (needSecret && !secretKey) throw new Error('Secret Key is required for this operation.')

  const headers = { 'Content-Type': 'application/json', 'apikey': apiKey }
  if (secretKey) headers['secretkey'] = secretKey

  const options = { method, headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(BASE + path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error || data.title || `Request failed (${res.status})`)
  }
  return data
}

// Customer
export const createOrUpdateCustomer = (payload, keys) =>
  gameballRequest('POST', '/customers', payload, keys)

// Events
export const sendEvent = (payload, keys) =>
  gameballRequest('POST', '/events', payload, keys)

// Points balance
export const getPointsBalance = (customerId, keys) =>
  gameballRequest('GET', `/customers/${customerId}/points`, null, keys)

// Tier
export const getCustomerTier = (customerId, keys) =>
  gameballRequest('GET', `/customers/${customerId}/tier`, null, keys)

// Campaigns / badges
export const getCustomerCampaigns = (customerId, keys) =>
  gameballRequest('GET', `/customers/${customerId}/campaigns`, null, keys)

// Hold points
export const holdPoints = (payload, keys) =>
  gameballRequest('POST', '/transactions/hold', payload, keys, true)

// Place order (earn + redeem)
export const placeOrder = (payload, keys) =>
  gameballRequest('POST', '/orders', payload, keys, true)

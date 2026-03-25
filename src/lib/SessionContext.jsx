import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [customerId, setCustomerIdState] = useState(() => localStorage.getItem('gb_session_id') || null)
  const [customerName, setCustomerNameState] = useState(() => localStorage.getItem('gb_session_name') || null)

  const setCustomerId = (id) => {
    if (id) localStorage.setItem('gb_session_id', id)
    else localStorage.removeItem('gb_session_id')
    setCustomerIdState(id)
  }

  const setCustomerName = (name) => {
    if (name) localStorage.setItem('gb_session_name', name)
    else localStorage.removeItem('gb_session_name')
    setCustomerNameState(name)
  }
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GAMEBALL_API_KEY || '')
  const [secretKey, setSecretKey] = useState(import.meta.env.VITE_GAMEBALL_SECRET_KEY || '')
  const [holdReference, setHoldReferenceState] = useState(() => localStorage.getItem('gb_hold_reference') || null)

  const setHoldReference = (ref) => {
    if (ref) localStorage.setItem('gb_hold_reference', ref)
    else localStorage.removeItem('gb_hold_reference')
    setHoldReferenceState(ref)
  }

  const keys = { apiKey, secretKey }

  return (
    <SessionContext.Provider value={{
      customerId, setCustomerId,
      customerName, setCustomerName,
      apiKey, setApiKey,
      secretKey, setSecretKey,
      holdReference, setHoldReference,
      keys
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)

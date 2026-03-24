import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [customerId, setCustomerId] = useState(null)
  const [customerName, setCustomerName] = useState(null)
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GAMEBALL_API_KEY || '')
  const [secretKey, setSecretKey] = useState(import.meta.env.VITE_GAMEBALL_SECRET_KEY || '')
  const [holdReference, setHoldReference] = useState(null)

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

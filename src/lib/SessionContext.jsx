import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [customerId, setCustomerId] = useState(null)
  const [customerName, setCustomerName] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
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

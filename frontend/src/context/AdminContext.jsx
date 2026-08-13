import { createContext, useContext, useState, useCallback } from 'react'
import { api, getToken, setToken, limparToken } from '../api'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [autenticado, setAutenticado] = useState(!!getToken())

  const entrar = useCallback(async (senha) => {
    const resposta = await api.login(senha)
    setToken(resposta.access_token)
    setAutenticado(true)
  }, [])

  const sair = useCallback(() => {
    limparToken()
    setAutenticado(false)
  }, [])

  return (
    <AdminContext.Provider value={{ autenticado, entrar, sair }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const contexto = useContext(AdminContext)
  if (!contexto) throw new Error('useAdmin precisa estar dentro de AdminProvider')
  return contexto
}

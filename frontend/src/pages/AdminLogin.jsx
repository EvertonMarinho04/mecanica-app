import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

export default function AdminLogin() {
  const navegar = useNavigate()
  const { entrar } = useAdmin()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(senha)
      navegar('/admin')
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pagina pagina-estreita" style={{ display: 'flex', alignItems: 'center', minHeight: '70vh' }}>
      <form onSubmit={enviar} className="cartao" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.3rem', marginTop: 6 }}>Área do administrador</h1>
          <p className="subtitulo">Digite a senha para continuar</p>
        </div>

        {erro && <div className="mensagem-erro">{erro}</div>}

        <div className="campo">
          <label>Senha</label>
          <input
            type="password"
            autoFocus
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button type="submit" className="botao botao-primario" disabled={enviando} style={{ width: '100%' }}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

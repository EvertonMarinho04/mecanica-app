import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

export default function Cabecalho() {
  const navegar = useNavigate()
  const { autenticado } = useAdmin()
  // Estrutura preparada para a logo oficial: basta colocar o arquivo
  // "logo.png" em frontend/public/ (veja LOGO_AQUI.md). Até lá, mostramos
  // o ícone 🔧 como substituto.
  const [logoDisponivel, setLogoDisponivel] = useState(true)

  return (
    <header style={estilos.cabecalho}>
      <Link to="/" style={estilos.marca}>
        {logoDisponivel ? (
          <img
            src="/logo.png"
            alt="Logo da empresa"
            style={estilos.marcaLogo}
            onError={() => setLogoDisponivel(false)}
          />
        ) : (
          <span style={estilos.marcaIcone}>🔧</span>
        )}
        <div>
          <div style={estilos.marcaTitulo}>Controle de Compras</div>
          <div style={estilos.marcaSub}>Mecânica &amp; Frota</div>
        </div>
      </Link>

      <button
        className="botao-texto"
        style={estilos.botaoAdmin}
        onClick={() => navegar(autenticado ? '/admin' : '/admin/login')}
      >
        🔒 Área do administrador
      </button>
    </header>
  )
}

const estilos = {
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    borderBottom: '1px solid var(--cor-borda)',
    background: 'var(--cor-superficie)',
  },
  marca: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    color: 'var(--cor-texto)',
  },
  marcaIcone: {
    fontSize: '1.4rem',
  },
  marcaLogo: {
    height: 42,
    width: 'auto',
    objectFit: 'contain',
  },
  marcaTitulo: {
    fontFamily: 'var(--fonte-display)',
    fontWeight: 600,
    fontSize: '1rem',
    lineHeight: 1.1,
  },
  marcaSub: {
    fontSize: '0.75rem',
    color: 'var(--cor-texto-fraco)',
  },
  botaoAdmin: {
    fontSize: '0.8rem',
    opacity: 0.75,
  },
}

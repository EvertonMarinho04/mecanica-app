import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

const ABAS = [
  { to: '/admin', rotulo: 'Dashboard', fim: true },
  { to: '/admin/pendentes', rotulo: 'Compras pendentes' },
  { to: '/admin/historico', rotulo: 'Histórico' },
]

export default function AdminLayout() {
  const { autenticado, sair } = useAdmin()
  const navegar = useNavigate()

  if (!autenticado) {
    return <Navigate to="/admin/login" replace />
  }

  function sairAgora() {
    sair()
    navegar('/')
  }

  return (
    <div>
      <header style={estilos.cabecalho}>
        <div style={estilos.marca}>
          <span>🔒</span>
          <span style={estilos.marcaTexto}>Painel administrativo</span>
        </div>
        <nav style={estilos.nav}>
          {ABAS.map((aba) => (
            <NavLink
              key={aba.to}
              to={aba.to}
              end={aba.fim}
              style={({ isActive }) => ({
                ...estilos.link,
                ...(isActive ? estilos.linkAtivo : {}),
              })}
            >
              {aba.rotulo}
            </NavLink>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="botao-texto" onClick={() => navegar('/')}>Área dos funcionários</button>
          <button className="botao botao-secundario" onClick={sairAgora} style={{ padding: '7px 14px' }}>Sair</button>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

const estilos = {
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 24px',
    background: 'var(--cor-primaria-escura)',
    color: '#fff',
    flexWrap: 'wrap',
    gap: 12,
  },
  marca: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'var(--fonte-display)',
    fontWeight: 600,
  },
  marcaTexto: {
    fontSize: '0.95rem',
  },
  nav: {
    display: 'flex',
    gap: 4,
  },
  link: {
    color: 'rgba(255,255,255,0.72)',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: 500,
    padding: '8px 12px',
    borderRadius: 6,
  },
  linkAtivo: {
    color: '#fff',
    background: 'rgba(255,255,255,0.12)',
  },
}

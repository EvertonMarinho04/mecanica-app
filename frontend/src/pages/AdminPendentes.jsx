import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatarMoeda, formatarDataHora } from '../format'
import { Carregando, EstadoVazio } from '../components/Estados'

export default function AdminPendentes() {
  const [compras, setCompras] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.pendentes().then(setCompras).catch((e) => setErro(e.message))
  }, [])

  return (
    <div className="pagina">
      <div className="cabecalho-pagina">
        <h1>🔔 Compras pendentes</h1>
        <p className="subtitulo">
          {compras ? `${compras.length} compra${compras.length === 1 ? '' : 's'} aguardando aprovação` : 'Carregando...'}
        </p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {compras === null ? (
        <Carregando />
      ) : compras.length === 0 ? (
        <div className="cartao">
          <EstadoVazio texto="Nenhuma compra pendente no momento. 🎉" />
        </div>
      ) : (
        <div className="grade-cartoes">
          {compras.map((compra) => (
            <Link
              key={compra.id}
              to={`/admin/compras/${compra.id}`}
              className="cartao cartao-link"
              style={estilos.item}
            >
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{compra.produto.nome}</div>
                <div className="subtitulo" style={{ fontSize: '0.85rem' }}>
                  {compra.responsavel.nome} · {compra.fornecedor} · {formatarDataHora(compra.data_registro)}
                </div>
              </div>
              <div style={estilos.valor} className="dado">{formatarMoeda(compra.valor_total)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const estilos = {
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    gap: 12,
  },
  valor: {
    fontWeight: 600,
    fontSize: '1.05rem',
    color: 'var(--cor-primaria-escura)',
    whiteSpace: 'nowrap',
  },
}

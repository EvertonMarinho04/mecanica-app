import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatarMoeda, formatarData } from '../format'
import BadgeStatus from '../components/BadgeStatus'
import { Carregando, EstadoVazio } from '../components/Estados'

export default function AdminHistorico() {
  const [compras, setCompras] = useState(null)
  const [produtos, setProdutos] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [erro, setErro] = useState('')
  const [filtros, setFiltros] = useState({
    status_filtro: '',
    produto_id: '',
    responsavel_id: '',
    data_inicio: '',
    data_fim: '',
  })

  useEffect(() => {
    api.listarProdutos().then(setProdutos).catch(() => {})
    api.listarResponsaveis().then(setResponsaveis).catch(() => {})
  }, [])

  function carregar(filtrosAtuais) {
    setCompras(null)
    // data_fim vem de um <input type="date"> (só a data, sem hora). Se enviada
    // como está, a API interpretaria como 00:00:00 e excluiria compras feitas
    // mais tarde nesse mesmo dia — por isso estendemos até o fim do dia aqui.
    const filtrosParaApi = { ...filtrosAtuais }
    if (filtrosParaApi.data_fim) {
      filtrosParaApi.data_fim = `${filtrosParaApi.data_fim}T23:59:59`
    }
    api.historicoCompras(filtrosParaApi).then(setCompras).catch((e) => setErro(e.message))
  }

  useEffect(() => {
    carregar(filtros)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function atualizarFiltro(campo, valor) {
    const novosFiltros = { ...filtros, [campo]: valor }
    setFiltros(novosFiltros)
    carregar(novosFiltros)
  }

  return (
    <div className="pagina">
      <div className="cabecalho-pagina">
        <h1>Histórico de compras</h1>
        <p className="subtitulo">Todas as compras registradas, com filtros</p>
      </div>

      <div className="cartao" style={{ marginBottom: 20 }}>
        <div style={estilos.grade}>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={filtros.status_filtro} onChange={(e) => atualizarFiltro('status_filtro', e.target.value)}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="aprovada">Aprovada</option>
              <option value="recusada">Recusada</option>
            </select>
          </div>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Produto</label>
            <select value={filtros.produto_id} onChange={(e) => atualizarFiltro('produto_id', e.target.value)}>
              <option value="">Todos</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Responsável</label>
            <select value={filtros.responsavel_id} onChange={(e) => atualizarFiltro('responsavel_id', e.target.value)}>
              <option value="">Todos</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>De</label>
            <input type="date" value={filtros.data_inicio} onChange={(e) => atualizarFiltro('data_inicio', e.target.value)} />
          </div>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Até</label>
            <input type="date" value={filtros.data_fim} onChange={(e) => atualizarFiltro('data_fim', e.target.value)} />
          </div>
        </div>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {compras === null ? (
        <Carregando />
      ) : compras.length === 0 ? (
        <div className="cartao"><EstadoVazio texto="Nenhuma compra encontrada para esses filtros." /></div>
      ) : (
        <div className="grade-cartoes">
          {compras.map((compra) => (
            <Link
              key={compra.id}
              to={compra.status === 'pendente' ? `/admin/compras/${compra.id}` : '#'}
              onClick={(e) => { if (compra.status !== 'pendente') e.preventDefault() }}
              className="cartao cartao-link"
              style={estilos.item}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{compra.produto.nome}</span>
                  <BadgeStatus status={compra.status} />
                </div>
                <div className="subtitulo" style={{ fontSize: '0.85rem' }}>
                  {compra.responsavel.nome} · {formatarData(compra.data_registro)}
                </div>
              </div>
              <div className="dado" style={{ fontWeight: 600 }}>{formatarMoeda(compra.valor_total)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const estilos = {
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 14,
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'inherit',
    gap: 12,
  },
}

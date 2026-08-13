import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { formatarMoeda, formatarDataHora, formatarPercentual } from '../format'
import BadgeStatus from '../components/BadgeStatus'
import { Carregando } from '../components/Estados'

export default function AdminCompraDetalhe() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [compra, setCompra] = useState(null)
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const [mostrarRecusa, setMostrarRecusa] = useState(false)
  const [motivo, setMotivo] = useState('')

  function carregar() {
    api.detalheCompra(id).then(setCompra).catch((e) => setErro(e.message))
  }

  useEffect(carregar, [id])

  async function aprovar() {
    setProcessando(true)
    setErro('')
    try {
      await api.aprovarCompra(id)
      navegar('/admin/pendentes')
    } catch (e) {
      setErro(e.message)
      setProcessando(false)
    }
  }

  async function recusar() {
    setProcessando(true)
    setErro('')
    try {
      await api.recusarCompra(id, motivo)
      navegar('/admin/pendentes')
    } catch (e) {
      setErro(e.message)
      setProcessando(false)
    }
  }

  if (!compra) {
    return (
      <div className="pagina pagina-estreita">
        {erro ? <div className="mensagem-erro">{erro}</div> : <Carregando />}
      </div>
    )
  }

  const precoAcimaDaMedia = compra.variacao_percentual !== null && compra.variacao_percentual > 0

  return (
    <div className="pagina pagina-estreita">
      <Link to="/admin/pendentes" className="botao-texto" style={{ display: 'inline-block', marginBottom: 12 }}>
        ← Voltar para pendentes
      </Link>

      <div className="cabecalho-pagina" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{compra.produto.nome}</h1>
        <BadgeStatus status={compra.status} />
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {precoAcimaDaMedia && (
        <div className="mensagem-erro" style={{ background: 'var(--cor-alerta-clara)', color: 'var(--cor-alerta)' }}>
          ⚠️ Preço {formatarPercentual(compra.variacao_percentual)} acima do preço médio histórico deste produto.
        </div>
      )}

      <div className="cartao" style={{ marginBottom: 16 }}>
        <dl style={estilos.lista}>
          <Linha rotulo="Quantidade" valor={`${compra.quantidade} ${compra.produto.unidade}`} />
          <Linha rotulo="Preço unitário" valor={formatarMoeda(compra.preco_unitario)} />
          <Linha rotulo="Valor total" valor={formatarMoeda(compra.valor_total)} destaque />
          <Linha rotulo="Preço médio histórico" valor={compra.preco_medio_historico ? formatarMoeda(compra.preco_medio_historico) : 'Sem histórico ainda'} />
          <Linha rotulo="Fornecedor" valor={compra.fornecedor} />
          <Linha rotulo="Número da NF" valor={compra.numero_nf || '—'} />
          <Linha rotulo="Responsável" valor={compra.responsavel.nome} />
          <Linha rotulo="Data do registro" valor={formatarDataHora(compra.data_registro)} />
          <Linha rotulo="Estoque atual do produto" valor={`${compra.estoque_atual_produto} ${compra.produto.unidade}`} />
          {compra.observacao && <Linha rotulo="Observação" valor={compra.observacao} />}
          {compra.motivo_recusa && <Linha rotulo="Motivo da recusa" valor={compra.motivo_recusa} />}
        </dl>
      </div>

      {compra.status === 'pendente' && (
        <div className="cartao">
          {!mostrarRecusa ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="botao botao-sucesso" style={{ flex: 1 }} disabled={processando} onClick={aprovar}>
                ✅ Aprovar
              </button>
              <button className="botao botao-erro" style={{ flex: 1 }} disabled={processando} onClick={() => setMostrarRecusa(true)}>
                ❌ Recusar
              </button>
            </div>
          ) : (
            <div>
              <div className="campo">
                <label>Motivo da recusa <span className="ajuda">(opcional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Ex.: Já temos quantidade suficiente em estoque."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="botao botao-secundario" style={{ flex: 1 }} onClick={() => setMostrarRecusa(false)} disabled={processando}>
                  Cancelar
                </button>
                <button className="botao botao-erro" style={{ flex: 1 }} onClick={recusar} disabled={processando}>
                  {processando ? 'Recusando...' : 'Confirmar recusa'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Linha({ rotulo, valor, destaque }) {
  return (
    <div style={estilos.linha}>
      <dt className="subtitulo" style={{ fontSize: '0.85rem' }}>{rotulo}</dt>
      <dd style={{ margin: 0, fontWeight: destaque ? 700 : 500, fontSize: destaque ? '1.15rem' : '1rem' }} className={destaque ? 'dado' : ''}>
        {valor}
      </dd>
    </div>
  )
}

const estilos = {
  lista: {
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  linha: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 16,
    paddingBottom: 10,
    borderBottom: '1px solid var(--cor-borda)',
  },
}

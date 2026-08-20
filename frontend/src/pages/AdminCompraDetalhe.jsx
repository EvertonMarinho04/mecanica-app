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
  const [acao, setAcao] = useState(null) // null | 'aprovar' | 'recusar'
  const [textoJustificativa, setTextoJustificativa] = useState('')
  const [quantidadeAprovada, setQuantidadeAprovada] = useState('')

  function carregar() {
    api.detalheCompra(id).then((dados) => {
      setCompra(dados)
      setQuantidadeAprovada(String(dados.quantidade))
    }).catch((e) => setErro(e.message))
  }

  useEffect(carregar, [id])

  function abrirAcao(tipo) {
    setAcao(tipo)
    setTextoJustificativa('')
  }

  async function confirmarAcao() {
    setProcessando(true)
    setErro('')
    try {
      if (acao === 'aprovar') {
        const valor = Number(quantidadeAprovada)
        if (!quantidadeAprovada || valor <= 0) {
          setErro('Informe uma quantidade aprovada maior que zero.')
          setProcessando(false)
          return
        }
        if (valor > compra.quantidade) {
          setErro('A quantidade aprovada não pode ser maior que a solicitada.')
          setProcessando(false)
          return
        }
        await api.aprovarCompra(id, textoJustificativa.trim() || null, valor)
      } else {
        await api.recusarCompra(id, textoJustificativa.trim() || null)
      }
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
          <Linha rotulo="Quantidade solicitada" valor={`${compra.quantidade_solicitada} ${compra.produto.unidade}`} />
          {compra.quantidade_aprovada !== null && (
            <Linha rotulo="Quantidade aprovada" valor={`${compra.quantidade_aprovada} ${compra.produto.unidade}`} />
          )}
          {compra.quantidade_aprovada !== null && (
            <Linha rotulo="Quantidade recebida" valor={`${compra.quantidade_recebida} de ${compra.quantidade_aprovada} ${compra.produto.unidade}`} />
          )}
          <Linha rotulo="Preço unitário" valor={formatarMoeda(compra.preco_unitario)} />
          <Linha rotulo="Valor total (estimado na solicitação)" valor={formatarMoeda(compra.valor_total)} destaque />
          <Linha rotulo="Preço médio histórico" valor={compra.preco_medio_historico ? formatarMoeda(compra.preco_medio_historico) : 'Sem histórico ainda'} />
          <Linha rotulo="Fornecedor" valor={compra.fornecedor} />
          <Linha rotulo="Número da NF" valor={compra.numero_nf || '—'} />
          <Linha rotulo="Responsável" valor={compra.responsavel.nome} />
          <Linha rotulo="Data do registro" valor={formatarDataHora(compra.data_registro)} />
          <Linha rotulo="Estoque atual do produto" valor={`${compra.estoque_atual_produto} ${compra.produto.unidade}`} />
          {compra.observacao && <Linha rotulo="Observação" valor={compra.observacao} />}
          {compra.status !== 'pendente' && (
            <Linha
              rotulo={compra.status === 'recusada' ? 'Motivo da recusa' : 'Justificativa da aprovação'}
              valor={compra.justificativa || 'Nenhuma justificativa foi informada.'}
            />
          )}
        </dl>
      </div>

      {compra.status === 'pendente' && (
        <div className="cartao">
          {!acao ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="botao botao-sucesso" style={{ flex: 1 }} disabled={processando} onClick={() => abrirAcao('aprovar')}>
                ✅ Aprovar
              </button>
              <button className="botao botao-erro" style={{ flex: 1 }} disabled={processando} onClick={() => abrirAcao('recusar')}>
                ❌ Recusar
              </button>
            </div>
          ) : (
            <div>
              {acao === 'aprovar' && (
                <div className="campo">
                  <label>Quantidade aprovada ({compra.produto.unidade})</label>
                  <input
                    type="number"
                    min="0"
                    max={compra.quantidade}
                    step="0.01"
                    value={quantidadeAprovada}
                    onChange={(e) => setQuantidadeAprovada(e.target.value)}
                  />
                  <span className="ajuda">Pode ser diferente da quantidade solicitada ({compra.quantidade_solicitada} {compra.produto.unidade}).</span>
                </div>
              )}
              <div className="campo">
                <label>
                  {acao === 'aprovar' ? 'Justificativa da aprovação' : 'Motivo da recusa'}{' '}
                  <span className="ajuda">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    acao === 'aprovar'
                      ? 'Ex.: Compra autorizada.'
                      : 'Ex.: Já temos quantidade suficiente em estoque.'
                  }
                  value={textoJustificativa}
                  onChange={(e) => setTextoJustificativa(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="botao botao-secundario" style={{ flex: 1 }} onClick={() => setAcao(null)} disabled={processando}>
                  Cancelar
                </button>
                <button
                  className={`botao ${acao === 'aprovar' ? 'botao-sucesso' : 'botao-erro'}`}
                  style={{ flex: 1 }}
                  onClick={confirmarAcao}
                  disabled={processando}
                >
                  {processando
                    ? 'Salvando...'
                    : acao === 'aprovar'
                    ? 'Confirmar aprovação'
                    : 'Confirmar recusa'}
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

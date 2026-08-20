import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatarData } from '../format'
import BadgeStatus from '../components/BadgeStatus'
import { Carregando, EstadoVazio } from '../components/Estados'
import { obterMeuNome, salvarMeuNome } from '../meuNome'

export default function MinhasSolicitacoes() {
  const [nome, setNome] = useState(obterMeuNome())
  const [nomeConsultado, setNomeConsultado] = useState('')
  const [solicitacoes, setSolicitacoes] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [recebendoId, setRecebendoId] = useState(null)
  const [quantidadeRecebimento, setQuantidadeRecebimento] = useState('')
  const [erroRecebimento, setErroRecebimento] = useState('')
  const [enviandoRecebimento, setEnviandoRecebimento] = useState(false)

  function buscar(nomeParaBuscar) {
    const alvo = (nomeParaBuscar ?? nome).trim()
    if (!alvo) {
      setErro('Digite seu nome para ver suas solicitações.')
      return
    }
    setErro('')
    setCarregando(true)
    api
      .minhasSolicitacoes(alvo)
      .then((dados) => {
        setSolicitacoes(dados)
        setNomeConsultado(alvo)
        salvarMeuNome(alvo)
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    const nomeSalvo = obterMeuNome()
    if (nomeSalvo) buscar(nomeSalvo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aoEnviar(e) {
    e.preventDefault()
    buscar()
  }

  function abrirRecebimento(solicitacao) {
    setRecebendoId(solicitacao.id)
    setQuantidadeRecebimento(String(solicitacao.quantidade_restante))
    setErroRecebimento('')
  }

  async function confirmarRecebimento(solicitacao) {
    const valor = Number(quantidadeRecebimento)
    if (!quantidadeRecebimento || valor <= 0) {
      setErroRecebimento('Informe uma quantidade maior que zero.')
      return
    }
    if (valor > solicitacao.quantidade_restante) {
      setErroRecebimento(`Você não pode receber mais do que o pendente (${solicitacao.quantidade_restante} ${solicitacao.produto.unidade}).`)
      return
    }
    setErroRecebimento('')
    setEnviandoRecebimento(true)
    try {
      await api.registrarRecebimento(solicitacao.id, valor)
      setRecebendoId(null)
      buscar(nomeConsultado)
    } catch (e) {
      setErroRecebimento(e.message)
    } finally {
      setEnviandoRecebimento(false)
    }
  }

  return (
    <div className="pagina pagina-estreita">
      <div className="cabecalho-pagina">
        <h1>📋 Minhas solicitações</h1>
        <p className="subtitulo">Veja o status das compras que você pediu</p>
      </div>

      <form onSubmit={aoEnviar} className="cartao" style={{ marginBottom: 20 }}>
        <div className="campo" style={{ marginBottom: 12 }}>
          <label>Seu nome</label>
          <input
            type="text"
            placeholder="Digite seu nome, como usou ao registrar a compra"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <button type="submit" className="botao botao-primario" disabled={carregando} style={{ width: '100%' }}>
          {carregando ? 'Buscando...' : 'Ver minhas solicitações'}
        </button>
      </form>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {solicitacoes !== null && (
        <>
          <p className="subtitulo" style={{ marginBottom: 12 }}>
            Solicitações de <strong style={{ color: 'var(--cor-texto)' }}>{nomeConsultado}</strong>
          </p>

          {solicitacoes.length === 0 ? (
            <div className="cartao">
              <EstadoVazio texto="Nenhuma solicitação encontrada com esse nome." />
            </div>
          ) : (
            <div className="grade-cartoes">
              {solicitacoes.map((s) => (
                <div key={s.id} className="cartao">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.produto.nome}</div>
                      <div className="subtitulo" style={{ fontSize: '0.85rem' }}>
                        Solicitado: {s.quantidade_solicitada} {s.produto.unidade} · {formatarData(s.data_registro)}
                      </div>
                    </div>
                    <BadgeStatus status={s.status} />
                  </div>

                  {s.status === 'pendente' && (
                    <p className="subtitulo" style={{ fontSize: '0.88rem', marginTop: 8 }}>
                      Aguardando análise do administrador.
                    </p>
                  )}

                  {s.quantidade_aprovada !== null && s.status !== 'recusada' && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.88rem' }}>
                      <span>Aprovado: <strong className="dado">{s.quantidade_aprovada} {s.produto.unidade}</strong></span>
                      <span>Recebido: <strong className="dado">{s.quantidade_recebida} {s.produto.unidade}</strong></span>
                      {s.quantidade_restante > 0 && (
                        <span>Restante: <strong className="dado">{s.quantidade_restante} {s.produto.unidade}</strong></span>
                      )}
                    </div>
                  )}

                  {s.status !== 'pendente' && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--cor-borda)' }}>
                      <div className="subtitulo" style={{ fontSize: '0.8rem', marginBottom: 2 }}>Justificativa</div>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {s.justificativa || 'Nenhuma justificativa foi informada.'}
                      </p>
                    </div>
                  )}

                  {(s.status === 'aprovada' || s.status === 'parcialmente_recebida') && s.quantidade_restante > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cor-borda)' }}>
                      {recebendoId !== s.id ? (
                        <button className="botao botao-primario" style={{ width: '100%' }} onClick={() => abrirRecebimento(s)}>
                          📥 Registrar recebimento
                        </button>
                      ) : (
                        <div>
                          {erroRecebimento && <div className="mensagem-erro">{erroRecebimento}</div>}
                          <div className="campo">
                            <label>Quantidade recebida agora ({s.produto.unidade})</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={quantidadeRecebimento}
                              onChange={(e) => setQuantidadeRecebimento(e.target.value)}
                              autoFocus
                            />
                            <span className="ajuda">Pendente de recebimento: {s.quantidade_restante} {s.produto.unidade}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button className="botao botao-secundario" style={{ flex: 1 }} onClick={() => setRecebendoId(null)} disabled={enviandoRecebimento}>
                              Cancelar
                            </button>
                            <button className="botao botao-primario" style={{ flex: 1 }} onClick={() => confirmarRecebimento(s)} disabled={enviandoRecebimento}>
                              {enviandoRecebimento ? 'Salvando...' : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {carregando && solicitacoes === null && <Carregando />}
    </div>
  )
}

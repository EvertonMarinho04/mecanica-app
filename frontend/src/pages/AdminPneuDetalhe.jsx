import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import { Carregando } from '../components/Estados'

const STATUS_OPCOES = [
  { valor: 'em_uso', rotulo: 'Em uso' },
  { valor: 'fora_de_uso', rotulo: 'Fora de uso' },
  { valor: 'reserva', rotulo: 'Reserva' },
  { valor: 'descartado', rotulo: 'Descartado' },
]

export default function AdminPneuDetalhe() {
  const { id } = useParams()
  const [pneu, setPneu] = useState(null)
  const [erro, setErro] = useState('')
  const [mostrarRodizio, setMostrarRodizio] = useState(false)
  const [placaNova, setPlacaNova] = useState('')
  const [posicaoNova, setPosicaoNova] = useState('')
  const [salvando, setSalvando] = useState(false)

  function carregar() {
    api.detalhePneu(id).then(setPneu).catch((e) => setErro(e.message))
  }

  useEffect(carregar, [id])

  async function confirmarRodizio(e) {
    e.preventDefault()
    if (!posicaoNova.trim()) {
      setErro('Informe a nova posição do pneu.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await api.registrarRodizio(id, {
        placa_nova: placaNova.trim() || null,
        posicao_nova: posicaoNova.trim(),
      })
      setMostrarRodizio(false)
      setPlacaNova('')
      setPosicaoNova('')
      carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function mudarStatus(status) {
    setErro('')
    try {
      await api.atualizarStatusPneu(id, status)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  if (!pneu) {
    return (
      <div className="pagina pagina-estreita">
        {erro ? <div className="mensagem-erro">{erro}</div> : <Carregando />}
      </div>
    )
  }

  return (
    <div className="pagina pagina-estreita">
      <Link to="/admin/pneus" className="botao-texto" style={{ display: 'inline-block', marginBottom: 12 }}>
        ← Voltar para pneus
      </Link>

      <div className="cabecalho-pagina">
        <h1>{pneu.numero}</h1>
        <p className="subtitulo">{[pneu.marca, pneu.modelo, pneu.medida].filter(Boolean).join(' · ') || 'Sem detalhes de marca/modelo'}</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      <div className="cartao" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <div className="subtitulo" style={{ fontSize: '0.8rem' }}>Caminhão atual</div>
            <div className="dado" style={{ fontWeight: 600 }}>{pneu.placa_atual || '—'}</div>
          </div>
          <div>
            <div className="subtitulo" style={{ fontSize: '0.8rem' }}>Posição atual</div>
            <div className="dado" style={{ fontWeight: 600 }}>{pneu.posicao_atual || '—'}</div>
          </div>
          <div>
            <div className="subtitulo" style={{ fontSize: '0.8rem' }}>KM de entrada</div>
            <div className="dado" style={{ fontWeight: 600 }}>{pneu.km_entrada ?? '—'}</div>
          </div>
        </div>

        <div className="campo" style={{ marginBottom: 0 }}>
          <label>Status</label>
          <select value={pneu.status} onChange={(e) => mudarStatus(e.target.value)}>
            {STATUS_OPCOES.map((s) => (
              <option key={s.valor} value={s.valor}>{s.rotulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="cartao" style={{ marginBottom: 16 }}>
        {!mostrarRodizio ? (
          <button className="botao botao-primario" style={{ width: '100%' }} onClick={() => setMostrarRodizio(true)}>
            🔁 Registrar rodízio / transferência
          </button>
        ) : (
          <form onSubmit={confirmarRodizio}>
            <div className="campo">
              <label>Nova posição</label>
              <input type="text" placeholder="Ex.: P3" value={posicaoNova} onChange={(e) => setPosicaoNova(e.target.value)} autoFocus />
            </div>
            <div className="campo">
              <label>Transferir para outra placa <span className="ajuda">(opcional — deixe em branco para manter o mesmo caminhão)</span></label>
              <input type="text" placeholder="Ex.: PGB-6B28" value={placaNova} onChange={(e) => setPlacaNova(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="botao botao-secundario" style={{ flex: 1 }} onClick={() => setMostrarRodizio(false)} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="botao botao-primario" style={{ flex: 1 }} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="cartao">
        <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Histórico de rodízios e transferências</h3>
        {pneu.historico.length === 0 ? (
          <p className="subtitulo">Nenhuma movimentação registrada ainda.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pneu.historico.map((m) => (
              <li key={m.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--cor-borda)' }}>
                <div className="subtitulo" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
                  {new Date(m.data).toLocaleDateString('pt-BR')} às {new Date(m.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.92rem' }}>
                  {m.placa_anterior || '—'} / {m.posicao_anterior || '—'} → <strong>{m.placa_nova || '—'} / {m.posicao_nova || '—'}</strong>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

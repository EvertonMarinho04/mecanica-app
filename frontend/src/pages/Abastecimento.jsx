import { useState } from 'react'
import { api } from '../api'

export default function Abastecimento() {
  const [form, setForm] = useState({ placa: '', km_anterior: '', km_atual: '', litros: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setResultado(null)

    if (!form.placa.trim() || !form.km_anterior || !form.km_atual || !form.litros) {
      setErro('Preencha a placa, KM anterior, KM atual e litros abastecidos.')
      return
    }

    setEnviando(true)
    try {
      const resposta = await api.registrarAbastecimento({
        placa: form.placa.trim().toUpperCase(),
        km_anterior: Number(form.km_anterior),
        km_atual: Number(form.km_atual),
        litros: Number(form.litros),
      })
      setResultado(resposta)
      setForm({ placa: '', km_anterior: '', km_atual: '', litros: '' })
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pagina pagina-estreita">
      <div className="cabecalho-pagina">
        <h1>⛽ Abastecimento</h1>
        <p className="subtitulo">Registre o abastecimento do caminhão pela placa</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {resultado && (
        <div className="cartao" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="subtitulo">KM rodado</span>
            <strong className="dado">{resultado.abastecimento.km_rodado} km</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="subtitulo">Média</span>
            <strong className="dado" style={{ fontSize: '1.2rem', color: 'var(--cor-primaria-escura)' }}>
              {resultado.abastecimento.media} km/L
            </strong>
          </div>
          {resultado.alerta_consumo && (
            <div className="mensagem-erro" style={{ background: 'var(--cor-alerta-clara)', color: 'var(--cor-alerta)', marginTop: 14, marginBottom: 0 }}>
              ⚠️ Atenção: {resultado.alerta_consumo}
            </div>
          )}
        </div>
      )}

      <form onSubmit={enviar} className="cartao">
        <div className="campo">
          <label>Placa do caminhão</label>
          <input
            type="text"
            placeholder="Ex.: PFS-6F04"
            value={form.placa}
            onChange={(e) => atualizarCampo('placa', e.target.value)}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="linha-campos">
          <div className="campo">
            <label>KM anterior</label>
            <input type="number" min="0" placeholder="Ex.: 290000" value={form.km_anterior} onChange={(e) => atualizarCampo('km_anterior', e.target.value)} />
          </div>
          <div className="campo">
            <label>KM atual</label>
            <input type="number" min="0" placeholder="Ex.: 290500" value={form.km_atual} onChange={(e) => atualizarCampo('km_atual', e.target.value)} />
          </div>
        </div>

        <div className="campo">
          <label>Litros abastecidos</label>
          <input type="number" min="0" step="0.01" placeholder="Ex.: 100" value={form.litros} onChange={(e) => atualizarCampo('litros', e.target.value)} />
        </div>

        <button type="submit" className="botao botao-primario" disabled={enviando} style={{ width: '100%', marginTop: 8 }}>
          {enviando ? 'Registrando...' : 'Registrar abastecimento'}
        </button>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { Carregando, EstadoVazio } from '../components/Estados'

const STATUS_ROTULO = {
  em_uso: { texto: 'Em uso', classe: 'etiqueta-sucesso' },
  fora_de_uso: { texto: 'Fora de uso', classe: 'etiqueta-alerta' },
  reserva: { texto: 'Reserva', classe: 'etiqueta-neutra' },
  descartado: { texto: 'Descartado', classe: 'etiqueta-erro' },
}

export default function AdminPneus() {
  const [pneus, setPneus] = useState(null)
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ numero: '', marca: '', modelo: '', medida: '', km_entrada: '', placa: '', posicao: '' })
  const [salvando, setSalvando] = useState(false)

  function carregar() {
    api.listarPneus().then(setPneus).catch((e) => setErro(e.message))
  }

  useEffect(carregar, [])

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function cadastrar(e) {
    e.preventDefault()
    if (!form.numero.trim()) {
      setErro('Informe o número/ID do pneu.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await api.cadastrarPneu({
        numero: form.numero.trim(),
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        medida: form.medida.trim() || null,
        km_entrada: form.km_entrada ? Number(form.km_entrada) : null,
        placa: form.placa.trim() || null,
        posicao: form.posicao.trim() || null,
      })
      setForm({ numero: '', marca: '', modelo: '', medida: '', km_entrada: '', placa: '', posicao: '' })
      setMostrarForm(false)
      carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="pagina">
      <div className="cabecalho-pagina" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🛞 Pneus</h1>
          <p className="subtitulo">Controle individual dos pneus da frota</p>
        </div>
        <button className="botao botao-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? 'Cancelar' : '+ Cadastrar pneu'}
        </button>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {mostrarForm && (
        <form onSubmit={cadastrar} className="cartao" style={{ marginBottom: 20 }}>
          <div className="linha-campos">
            <div className="campo">
              <label>Número/ID do pneu</label>
              <input type="text" placeholder="Ex.: PNEU-001" value={form.numero} onChange={(e) => atualizarCampo('numero', e.target.value)} />
            </div>
            <div className="campo">
              <label>Marca</label>
              <input type="text" placeholder="Ex.: Goodyear" value={form.marca} onChange={(e) => atualizarCampo('marca', e.target.value)} />
            </div>
          </div>
          <div className="linha-campos">
            <div className="campo">
              <label>Modelo</label>
              <input type="text" placeholder="Ex.: G667" value={form.modelo} onChange={(e) => atualizarCampo('modelo', e.target.value)} />
            </div>
            <div className="campo">
              <label>Medida</label>
              <input type="text" placeholder="Ex.: 295/80 R22.5" value={form.medida} onChange={(e) => atualizarCampo('medida', e.target.value)} />
            </div>
          </div>
          <div className="linha-campos">
            <div className="campo">
              <label>Placa do caminhão <span className="ajuda">(opcional)</span></label>
              <input type="text" placeholder="Ex.: PFS-6F04" value={form.placa} onChange={(e) => atualizarCampo('placa', e.target.value)} />
            </div>
            <div className="campo">
              <label>Posição <span className="ajuda">(opcional)</span></label>
              <input type="text" placeholder="Ex.: P1" value={form.posicao} onChange={(e) => atualizarCampo('posicao', e.target.value)} />
            </div>
          </div>
          <div className="campo">
            <label>KM de entrada <span className="ajuda">(opcional)</span></label>
            <input type="number" min="0" value={form.km_entrada} onChange={(e) => atualizarCampo('km_entrada', e.target.value)} />
          </div>
          <button type="submit" className="botao botao-primario" disabled={salvando} style={{ width: '100%' }}>
            {salvando ? 'Salvando...' : 'Cadastrar pneu'}
          </button>
        </form>
      )}

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        {pneus === null ? (
          <Carregando />
        ) : pneus.length === 0 ? (
          <EstadoVazio texto="Nenhum pneu cadastrado ainda." />
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Número</th>
                <th>Marca / Modelo</th>
                <th>Caminhão</th>
                <th>Posição</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pneus.map((p) => {
                const status = STATUS_ROTULO[p.status] || STATUS_ROTULO.em_uso
                return (
                  <tr key={p.id}>
                    <td>
                      <Link to={`/admin/pneus/${p.id}`} style={{ fontWeight: 600, color: 'var(--cor-primaria)' }}>
                        {p.numero}
                      </Link>
                    </td>
                    <td>{[p.marca, p.modelo].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="dado">{p.placa_atual || '—'}</td>
                    <td className="dado">{p.posicao_atual || '—'}</td>
                    <td><span className={`etiqueta ${status.classe}`}>{status.texto}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

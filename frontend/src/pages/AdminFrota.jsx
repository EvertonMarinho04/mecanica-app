import { useEffect, useState } from 'react'
import { api } from '../api'
import { Carregando } from '../components/Estados'

export default function AdminFrota() {
  const [periodo, setPeriodo] = useState('mes')
  const [resumo, setResumo] = useState(null)
  const [historico, setHistorico] = useState(null)
  const [erro, setErro] = useState('')

  function carregar(p) {
    setResumo(null)
    Promise.all([api.dashboardFrota(p), api.historicoAbastecimentos()])
      .then(([r, h]) => {
        setResumo(r)
        setHistorico(h)
      })
      .catch((e) => setErro(e.message))
  }

  useEffect(() => carregar(periodo), []) // eslint-disable-line react-hooks/exhaustive-deps

  function mudarPeriodo(p) {
    setPeriodo(p)
    carregar(p)
  }

  return (
    <div className="pagina">
      <div className="cabecalho-pagina">
        <h1>⛽ Consumo da frota</h1>
        <p className="subtitulo">Média de consumo por caminhão, identificados pela placa</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { valor: 'semana', rotulo: 'Última semana' },
          { valor: 'mes', rotulo: 'Último mês' },
          { valor: '', rotulo: 'Todo o período' },
        ].map((op) => (
          <button
            key={op.valor}
            className={`botao ${periodo === op.valor ? 'botao-primario' : 'botao-secundario'}`}
            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
            onClick={() => mudarPeriodo(op.valor)}
          >
            {op.rotulo}
          </button>
        ))}
      </div>

      {!resumo ? (
        <Carregando />
      ) : !resumo.media_frota ? (
        <div className="cartao">
          <p className="subtitulo">Nenhum abastecimento registrado nesse período.</p>
        </div>
      ) : (
        <>
          <div style={estilos.cartoesResumo}>
            <div className="cartao">
              <div className="subtitulo" style={{ fontSize: '0.8rem' }}>Média da frota</div>
              <div className="dado" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--cor-primaria-escura)' }}>
                {resumo.media_frota} km/L
              </div>
            </div>
            {resumo.melhor_media && (
              <div className="cartao">
                <div className="subtitulo" style={{ fontSize: '0.8rem' }}>Melhor média</div>
                <div className="dado" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {resumo.melhor_media.placa} — {resumo.melhor_media.media} km/L
                </div>
              </div>
            )}
            {resumo.pior_media && (
              <div className="cartao">
                <div className="subtitulo" style={{ fontSize: '0.8rem' }}>Pior média</div>
                <div className="dado" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {resumo.pior_media.placa} — {resumo.pior_media.media} km/L
                </div>
              </div>
            )}
            <div className="cartao">
              <div className="subtitulo" style={{ fontSize: '0.8rem' }}>KM rodado / Litros</div>
              <div className="dado" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {resumo.km_rodado_total} km / {resumo.litros_total} L
              </div>
            </div>
          </div>

          <div className="grade-2-colunas">
            <div className="cartao">
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Média por caminhão</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resumo.por_caminhao.map((c) => (
                  <li key={c.placa} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--cor-borda)' }}>
                    <span>{c.placa}</span>
                    <span className="dado" style={{ fontWeight: 600 }}>{c.media} km/L</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="cartao">
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Abaixo da média da frota</h3>
              {resumo.abaixo_da_media.length === 0 ? (
                <p className="subtitulo">Nenhum caminhão abaixo da média neste período.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {resumo.abaixo_da_media.map((c) => (
                    <li key={c.placa} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🔴 {c.placa}</span>
                      <span className="dado">{c.media} km/L</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <div className="cartao" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        <div style={{ padding: '14px 16px 0' }}>
          <h3 style={{ fontSize: '1rem' }}>Histórico de abastecimentos</h3>
        </div>
        {historico === null ? (
          <Carregando />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Placa</th>
                  <th>KM anterior</th>
                  <th>KM atual</th>
                  <th>KM rodado</th>
                  <th>Litros</th>
                  <th>Média</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((a) => (
                  <tr key={a.id}>
                    <td className="dado">{new Date(a.data).toLocaleDateString('pt-BR')}</td>
                    <td style={{ fontWeight: 600 }}>{a.placa}</td>
                    <td className="dado">{a.km_anterior}</td>
                    <td className="dado">{a.km_atual}</td>
                    <td className="dado">{a.km_rodado} km</td>
                    <td className="dado">{a.litros} L</td>
                    <td className="dado" style={{ fontWeight: 600 }}>{a.media} km/L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const estilos = {
  cartoesResumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
    marginBottom: 20,
  },
}

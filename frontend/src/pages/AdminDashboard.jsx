import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import { formatarMoeda, formatarPercentual } from '../format'
import { Carregando } from '../components/Estados'

export default function AdminDashboard() {
  const [resumo, setResumo] = useState(null)
  const [gastosMensais, setGastosMensais] = useState(null)
  const [gastosCategoria, setGastosCategoria] = useState(null)
  const [maioresAumentos, setMaioresAumentos] = useState(null)
  const [maisComprados, setMaisComprados] = useState(null)
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([
      api.resumoDashboard().then(setResumo),
      api.gastosMensais().then(setGastosMensais),
      api.gastosPorCategoria().then(setGastosCategoria),
      api.maioresAumentos().then(setMaioresAumentos),
      api.maisComprados().then(setMaisComprados),
      api.listarProdutos().then((produtos) => setProdutosEstoqueBaixo(produtos.filter((p) => p.estoque_baixo))),
    ]).catch((e) => setErro(e.message))
  }, [])

  const variacaoMensal = calcularVariacaoUltimoMes(gastosMensais)

  return (
    <div className="pagina">
      <div className="cabecalho-pagina">
        <h1>Dashboard</h1>
        <p className="subtitulo">Visão geral de gastos, compras e estoque</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {!resumo ? (
        <Carregando />
      ) : (
        <>
          <div style={estilos.cartoesResumo}>
            <CartaoResumo icone="💰" rotulo="Total gasto no mês" valor={formatarMoeda(resumo.total_gasto_mes)} link="/admin/compras-mes" />
            <CartaoResumo icone="🛒" rotulo="Compras no mês" valor={resumo.numero_compras_mes} link="/admin/compras-mes" />
            <CartaoResumo icone="📦" rotulo="Itens no estoque" valor={resumo.itens_em_estoque} link="/estoque" />
            <CartaoResumo
              icone="🔔"
              rotulo="Compras pendentes"
              valor={resumo.compras_pendentes}
              destaque={resumo.compras_pendentes > 0}
              link="/admin/pendentes"
            />
          </div>

          <div className="grade-2-colunas">
            <div className="cartao">
              <div style={estilos.cabecalhoCartao}>
                <h3 style={{ fontSize: '1rem' }}>Comparação de gastos mensais</h3>
                {variacaoMensal !== null && (
                  <span className={`etiqueta ${variacaoMensal <= 0 ? 'etiqueta-sucesso' : 'etiqueta-erro'}`}>
                    {variacaoMensal <= 0 ? '🟢' : '🔴'} {formatarPercentual(variacaoMensal)}
                  </span>
                )}
              </div>
              {gastosMensais && (
                <div style={{ width: '100%', height: 220, marginTop: 12 }}>
                  <ResponsiveContainer>
                    <BarChart data={gastosMensais}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--cor-texto-suave)' }} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatarMoeda(v)} />
                      <Tooltip formatter={(v) => formatarMoeda(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="total" fill="var(--cor-primaria)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="cartao">
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Gastos por categoria (mês atual)</h3>
              {gastosCategoria && gastosCategoria.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {gastosCategoria.map((g) => (
                    <li key={g.categoria} style={estilos.linhaCategoria}>
                      <span>{g.categoria}</span>
                      <span className="dado" style={{ fontWeight: 600 }}>{formatarMoeda(g.total)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtitulo">Nenhuma compra aprovada neste mês ainda.</p>
              )}
            </div>
          </div>

          <div className="grade-2-colunas">
            <div className="cartao">
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Produtos com maior aumento de preço</h3>
              {maioresAumentos && maioresAumentos.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {maioresAumentos.map((p) => (
                    <li key={p.produto} style={estilos.linhaCategoria}>
                      <span>{p.produto}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="dado" style={{ color: 'var(--cor-texto-fraco)', fontSize: '0.82rem' }}>
                          {formatarMoeda(p.preco_anterior)} → {formatarMoeda(p.preco_atual)}
                        </span>
                        <span className="etiqueta etiqueta-erro">🔴 {formatarPercentual(p.variacao_percentual)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtitulo">Nenhum aumento de preço identificado ainda.</p>
              )}
            </div>

            <div className="cartao">
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Produtos mais comprados (mês atual)</h3>
              {maisComprados && maisComprados.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {maisComprados.map((p) => (
                    <li key={p.produto} style={estilos.linhaCategoria}>
                      <span>{p.produto}</span>
                      <span className="dado">{p.quantidade_total} {p.unidade}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtitulo">Nenhuma compra aprovada neste mês ainda.</p>
              )}
            </div>

            <div className="cartao">
              <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>⚠️ Estoque baixo</h3>
              {produtosEstoqueBaixo && produtosEstoqueBaixo.length > 0 ? (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {produtosEstoqueBaixo.map((p) => (
                    <li key={p.id} style={estilos.linhaCategoria}>
                      <span>{p.nome}</span>
                      <span className="dado" style={{ color: 'var(--cor-erro)' }}>
                        Atual: {p.quantidade_atual} · Mínimo: {p.estoque_minimo}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtitulo">Nenhum produto abaixo do estoque mínimo. 🎉</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CartaoResumo({ icone, rotulo, valor, destaque, link }) {
  const conteudo = (
    <div
      className={`cartao${link ? ' cartao-link' : ''}`}
      style={{ ...estilos.cartaoResumo, ...(destaque ? estilos.cartaoResumoDestaque : {}), ...(link ? { cursor: 'pointer' } : {}) }}
    >
      <span style={{ fontSize: '1.5rem' }}>{icone}</span>
      <div>
        <div className="subtitulo" style={{ fontSize: '0.8rem' }}>{rotulo}</div>
        <div className="dado" style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--cor-primaria-escura)' }}>{valor}</div>
      </div>
    </div>
  )
  return link ? <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>{conteudo}</Link> : conteudo
}

function calcularVariacaoUltimoMes(gastosMensais) {
  if (!gastosMensais || gastosMensais.length < 2) return null
  const atual = gastosMensais[gastosMensais.length - 1].total
  const anterior = gastosMensais[gastosMensais.length - 2].total
  if (!anterior) return null
  return Math.round(((atual - anterior) / anterior) * 1000) / 10
}

const estilos = {
  cartoesResumo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
    marginBottom: 20,
  },
  cartaoResumo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  cartaoResumoDestaque: {
    borderColor: 'var(--cor-alerta)',
    background: 'var(--cor-alerta-clara)',
  },
  grade2: {
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr',
    gap: 16,
    marginBottom: 16,
  },
  cabecalhoCartao: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linhaCategoria: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.92rem',
    paddingBottom: 8,
    borderBottom: '1px solid var(--cor-borda)',
  },
}

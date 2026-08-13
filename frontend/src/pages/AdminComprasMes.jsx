import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { formatarMoeda, formatarData } from '../format'
import BadgeStatus from '../components/BadgeStatus'
import { Carregando, EstadoVazio } from '../components/Estados'

function inicioFimDoMesAtual() {
  const agora = new Date()
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0)
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59)
  const paraISO = (d) => {
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  return { data_inicio: paraISO(inicio), data_fim: paraISO(fim) }
}

export default function AdminComprasMes() {
  const [compras, setCompras] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api.historicoCompras(inicioFimDoMesAtual()).then(setCompras).catch((e) => setErro(e.message))
  }, [])

  return (
    <div className="pagina">
      <Link to="/admin" className="botao-texto" style={{ display: 'inline-block', marginBottom: 12 }}>
        ← Voltar ao dashboard
      </Link>

      <div className="cabecalho-pagina">
        <h1>Compras do mês</h1>
        <p className="subtitulo">Todas as compras registradas no mês atual, com detalhes</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        {compras === null ? (
          <Carregando />
        ) : compras.length === 0 ? (
          <EstadoVazio texto="Nenhuma compra registrada neste mês ainda." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Preço unitário</th>
                  <th>Valor total</th>
                  <th>Fornecedor</th>
                  <th>Responsável</th>
                  <th>Data</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((compra) => (
                  <tr key={compra.id}>
                    <td style={{ fontWeight: 600 }}>{compra.produto.nome}</td>
                    <td className="dado">{compra.quantidade} {compra.produto.unidade}</td>
                    <td className="dado">{formatarMoeda(compra.preco_unitario)}</td>
                    <td className="dado" style={{ fontWeight: 600 }}>{formatarMoeda(compra.valor_total)}</td>
                    <td>{compra.fornecedor}</td>
                    <td>{compra.responsavel.nome}</td>
                    <td className="dado">{formatarData(compra.data_registro)}</td>
                    <td><BadgeStatus status={compra.status} /></td>
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

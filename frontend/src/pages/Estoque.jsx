import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import { Carregando, EstadoVazio } from '../components/Estados'
import ModalConfirmacao from '../components/ModalConfirmacao'
import ModalBaixaEstoque from '../components/ModalBaixaEstoque'
import { useAdmin } from '../context/AdminContext'

export default function Estoque() {
  const { autenticado } = useAdmin()
  const [produtos, setProdutos] = useState(null)
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [produtoParaBaixa, setProdutoParaBaixa] = useState(null)

  const carregar = useCallback(async (termo) => {
    try {
      const dados = await api.listarProdutos(termo)
      setProdutos(dados)
    } catch (e) {
      setErro(e.message)
    }
  }, [])

  useEffect(() => {
    carregar('')
  }, [carregar])

  useEffect(() => {
    const timeout = setTimeout(() => carregar(busca), 300)
    return () => clearTimeout(timeout)
  }, [busca, carregar])

  async function confirmarExclusao() {
    if (!produtoParaExcluir) return
    setExcluindo(true)
    setErro('')
    try {
      await api.excluirProduto(produtoParaExcluir.id)
      setProdutoParaExcluir(null)
      carregar(busca)
    } catch (e) {
      setErro(e.message)
      setProdutoParaExcluir(null)
    } finally {
      setExcluindo(false)
    }
  }

  async function confirmarBaixa(quantidade) {
    if (!produtoParaBaixa) return
    setErro('')
    setSucesso('')
    // Erros daqui sao relancados para o modal mostrar a mensagem ali dentro
    // e continuar aberto - assim o estoque exibido na tela so muda de fato
    // depois que a API confirmar que deu certo.
    await api.darBaixaEstoque(produtoParaBaixa.id, quantidade)
    setSucesso(`Baixa registrada: ${produtoParaBaixa.nome} agora tem ${(produtoParaBaixa.quantidade_atual - quantidade)} ${produtoParaBaixa.unidade} em estoque.`)
    setProdutoParaBaixa(null)
    carregar(busca)
  }

  return (
    <div className="pagina">
      <div className="cabecalho-pagina">
        <h1>📦 Estoque</h1>
        <p className="subtitulo">Produtos disponíveis e níveis de estoque</p>
      </div>

      <div className="campo" style={{ maxWidth: 360, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar produto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}
      {sucesso && <div className="mensagem-sucesso">{sucesso}</div>}

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        {produtos === null ? (
          <Carregando />
        ) : produtos.length === 0 ? (
          <EstadoVazio texto="Nenhum produto encontrado." />
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Estoque mínimo</th>
                <th>Situação</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td style={{ fontWeight: 600 }}>{produto.nome}</td>
                  <td>{produto.categoria.nome}</td>
                  <td className="dado">{produto.quantidade_atual} {produto.unidade}</td>
                  <td className="dado">{produto.estoque_minimo} {produto.unidade}</td>
                  <td>
                    {produto.estoque_baixo ? (
                      <span className="etiqueta etiqueta-erro">🔴 Estoque baixo</span>
                    ) : (
                      <span className="etiqueta etiqueta-sucesso">🟢 Normal</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="botao-texto" onClick={() => setProdutoParaBaixa(produto)}>
                      Dar baixa
                    </button>
                    {autenticado && (
                      <button className="botao-texto" style={{ marginLeft: 10 }} onClick={() => setProdutoParaExcluir(produto)}>
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {produtoParaExcluir && (
        <ModalConfirmacao
          titulo="Excluir produto"
          mensagem={`Tem certeza que deseja excluir "${produtoParaExcluir.nome}"?`}
          onCancelar={() => setProdutoParaExcluir(null)}
          onConfirmar={confirmarExclusao}
          confirmando={excluindo}
        />
      )}

      {produtoParaBaixa && (
        <ModalBaixaEstoque
          produto={produtoParaBaixa}
          onCancelar={() => setProdutoParaBaixa(null)}
          onConfirmar={confirmarBaixa}
        />
      )}
    </div>
  )
}

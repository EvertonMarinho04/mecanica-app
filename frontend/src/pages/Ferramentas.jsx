import { useEffect, useState } from 'react'
import { api } from '../api'
import { Carregando, EstadoVazio } from '../components/Estados'

export default function Ferramentas() {
  const [ferramentas, setFerramentas] = useState(null)
  const [erro, setErro] = useState('')
  const [nomeNovo, setNomeNovo] = useState('')
  const [quantidadeNova, setQuantidadeNova] = useState('')
  const [salvandoId, setSalvandoId] = useState(null)

  function carregar() {
    api.listarFerramentas().then(setFerramentas).catch((e) => setErro(e.message))
  }

  useEffect(carregar, [])

  async function adicionar(e) {
    e.preventDefault()
    setErro('')
    if (!nomeNovo.trim()) {
      setErro('Informe o nome da ferramenta.')
      return
    }
    try {
      await api.criarFerramenta({ nome: nomeNovo.trim(), quantidade: Number(quantidadeNova) || 0 })
      setNomeNovo('')
      setQuantidadeNova('')
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function alterarQuantidade(ferramenta, delta) {
    const novaQuantidade = Math.max(0, ferramenta.quantidade + delta)
    setSalvandoId(ferramenta.id)
    try {
      await api.atualizarFerramenta(ferramenta.id, { quantidade: novaQuantidade })
      carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvandoId(null)
    }
  }

  async function excluir(ferramenta) {
    if (!window.confirm(`Excluir "${ferramenta.nome}"?`)) return
    try {
      await api.excluirFerramenta(ferramenta.id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="pagina pagina-estreita">
      <div className="cabecalho-pagina">
        <h1>🔧 Ferramentas</h1>
        <p className="subtitulo">Controle simples das ferramentas da oficina</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      <form onSubmit={adicionar} className="cartao" style={{ marginBottom: 20 }}>
        <div className="linha-campos" style={{ alignItems: 'end' }}>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Nova ferramenta</label>
            <input type="text" placeholder="Ex.: Chave de roda" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} />
          </div>
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Quantidade</label>
            <input type="number" min="0" placeholder="0" value={quantidadeNova} onChange={(e) => setQuantidadeNova(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="botao botao-primario" style={{ marginTop: 14, width: '100%' }}>
          Adicionar ferramenta
        </button>
      </form>

      <div className="cartao" style={{ padding: 0, overflow: 'hidden' }}>
        {ferramentas === null ? (
          <Carregando />
        ) : ferramentas.length === 0 ? (
          <EstadoVazio texto="Nenhuma ferramenta cadastrada ainda." />
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Ferramenta</th>
                <th>Quantidade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ferramentas.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.nome}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        className="botao botao-secundario"
                        style={{ padding: '4px 10px' }}
                        disabled={salvandoId === f.id}
                        onClick={() => alterarQuantidade(f, -1)}
                      >
                        −
                      </button>
                      <span className="dado" style={{ minWidth: 24, textAlign: 'center' }}>{f.quantidade}</span>
                      <button
                        className="botao botao-secundario"
                        style={{ padding: '4px 10px' }}
                        disabled={salvandoId === f.id}
                        onClick={() => alterarQuantidade(f, 1)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="botao-texto" onClick={() => excluir(f)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../api'
import { Carregando, EstadoVazio } from '../components/Estados'
import ModalConfirmacao from '../components/ModalConfirmacao'
import { useAdmin } from '../context/AdminContext'

export default function Ferramentas() {
  const { autenticado } = useAdmin()
  const [ferramentas, setFerramentas] = useState(null)
  const [erro, setErro] = useState('')
  const [nomeNovo, setNomeNovo] = useState('')
  const [marcaNova, setMarcaNova] = useState('')
  const [quantidadeNova, setQuantidadeNova] = useState('')
  const [salvandoId, setSalvandoId] = useState(null)
  const [ferramentaParaExcluir, setFerramentaParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)

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
      await api.criarFerramenta({
        nome: nomeNovo.trim(),
        marca: marcaNova.trim() || null,
        quantidade: Number(quantidadeNova) || 0,
      })
      setNomeNovo('')
      setMarcaNova('')
      setQuantidadeNova('')
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function darEntrada(ferramenta) {
    setErro('')
    setSalvandoId(ferramenta.id)
    try {
      await api.ferramentaEntrada(ferramenta.id, 1)
      carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvandoId(null)
    }
  }

  async function darSaida(ferramenta) {
    setErro('')
    setSalvandoId(ferramenta.id)
    try {
      await api.ferramentaSaida(ferramenta.id, 1)
      carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvandoId(null)
    }
  }

  async function confirmarExclusao() {
    if (!ferramentaParaExcluir) return
    setExcluindo(true)
    setErro('')
    try {
      await api.excluirFerramenta(ferramentaParaExcluir.id)
      setFerramentaParaExcluir(null)
      carregar()
    } catch (e) {
      setErro(e.message)
      setFerramentaParaExcluir(null)
    } finally {
      setExcluindo(false)
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
        <div className="campo">
          <label>Nova ferramenta</label>
          <input type="text" placeholder="Ex.: Chave de roda" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} />
        </div>
        <div className="linha-campos">
          <div className="campo" style={{ marginBottom: 0 }}>
            <label>Marca <span className="ajuda">(opcional)</span></label>
            <input type="text" placeholder="Ex.: Tramontina" value={marcaNova} onChange={(e) => setMarcaNova(e.target.value)} />
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
                  <td>
                    <div style={{ fontWeight: 600 }}>{f.nome}</div>
                    {f.marca && <div className="subtitulo" style={{ fontSize: '0.82rem' }}>{f.marca}</div>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {autenticado && (
                        <button
                          className="botao botao-secundario"
                          style={{ padding: '4px 10px' }}
                          disabled={salvandoId === f.id || f.quantidade <= 0}
                          onClick={() => darSaida(f)}
                        >
                          −
                        </button>
                      )}
                      <span className="dado" style={{ minWidth: 24, textAlign: 'center' }}>{f.quantidade}</span>
                      <button
                        className="botao botao-secundario"
                        style={{ padding: '4px 10px' }}
                        disabled={salvandoId === f.id}
                        onClick={() => darEntrada(f)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {autenticado && (
                      <button className="botao-texto" onClick={() => setFerramentaParaExcluir(f)}>Excluir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!autenticado && (
        <p className="subtitulo" style={{ fontSize: '0.82rem', marginTop: 10 }}>
          Retiradas (botão "−") só podem ser feitas pelo administrador, para manter o controle de quem tirou o quê.
        </p>
      )}

      {ferramentaParaExcluir && (
        <ModalConfirmacao
          titulo="Excluir ferramenta"
          mensagem={`Tem certeza que deseja excluir "${ferramentaParaExcluir.nome}"?`}
          onCancelar={() => setFerramentaParaExcluir(null)}
          onConfirmar={confirmarExclusao}
          confirmando={excluindo}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { formatarMoeda } from '../format'
import { obterMeuNome, salvarMeuNome } from '../meuNome'

export default function RegistrarCompra() {
  const navegar = useNavigate()
  const [produtos, setProdutos] = useState([])
  const [responsaveis, setResponsaveis] = useState([])
  const [form, setForm] = useState({
    produto_nome: '',
    quantidade: '',
    preco_unitario: '',
    fornecedor: '',
    numero_nf: '',
    responsavel_nome: obterMeuNome(),
    observacao: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(null)

  useEffect(() => {
    api.listarProdutos().then(setProdutos).catch(() => {})
    api.listarResponsaveis().then(setResponsaveis).catch(() => {})
  }, [])

  const produtoCorrespondente = produtos.find(
    (p) => p.nome.trim().toLowerCase() === form.produto_nome.trim().toLowerCase()
  )
  const quantidadeNum = parseFloat(form.quantidade) || 0
  const precoNum = parseFloat(form.preco_unitario) || 0
  const total = quantidadeNum * precoNum

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setSucesso(null)

    if (!form.produto_nome.trim() || !form.quantidade || !form.preco_unitario || !form.fornecedor.trim() || !form.responsavel_nome.trim()) {
      setErro('Preencha produto, quantidade, preço unitário, fornecedor e responsável.')
      return
    }

    setEnviando(true)
    try {
      const compra = await api.registrarCompra({
        produto_nome: form.produto_nome.trim(),
        quantidade: Number(form.quantidade),
        preco_unitario: Number(form.preco_unitario),
        fornecedor: form.fornecedor.trim(),
        numero_nf: form.numero_nf.trim() || null,
        responsavel_nome: form.responsavel_nome.trim(),
        observacao: form.observacao.trim() || null,
      })
      setSucesso(compra)
      salvarMeuNome(form.responsavel_nome.trim())
      setForm({ produto_nome: '', quantidade: '', preco_unitario: '', fornecedor: '', numero_nf: '', responsavel_nome: form.responsavel_nome, observacao: '' })
      api.listarResponsaveis().then(setResponsaveis).catch(() => {})
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="pagina pagina-estreita">
        <div className="cartao" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>✅</div>
          <h2 style={{ marginBottom: 6 }}>Compra enviada para aprovação</h2>
          <p className="subtitulo" style={{ marginBottom: 20 }}>
            {sucesso.produto.nome} — {formatarMoeda(sucesso.valor_total)} — aguardando análise do administrador.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="botao botao-secundario" onClick={() => navegar('/')}>Voltar ao início</button>
            <button className="botao botao-primario" onClick={() => setSucesso(null)}>Registrar outra compra</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina pagina-estreita">
      <div className="cabecalho-pagina">
        <h1>🛒 Registrar compra</h1>
        <p className="subtitulo">A compra ficará pendente até ser aprovada pelo administrador</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      <form onSubmit={enviar} className="cartao">
        <div className="campo">
          <label>Produto</label>
          <input
            type="text"
            list="lista-produtos-compra"
            placeholder="Digite o nome do produto/peça"
            value={form.produto_nome}
            onChange={(e) => atualizarCampo('produto_nome', e.target.value)}
          />
          <datalist id="lista-produtos-compra">
            {produtos.map((p) => (
              <option key={p.id} value={p.nome} />
            ))}
          </datalist>
          {form.produto_nome.trim() && (
            produtoCorrespondente ? (
              <span className="ajuda" style={{ color: 'var(--cor-sucesso)' }}>
                ✓ Produto encontrado no cadastro ({produtoCorrespondente.unidade})
              </span>
            ) : (
              <span className="ajuda" style={{ color: 'var(--cor-alerta)' }}>
                Produto não encontrado no cadastro. Cadastre a peça antes de enviar, se ainda não existir.
              </span>
            )
          )}
        </div>

        <div className="linha-campos">
          <div className="campo">
            <label>Quantidade {produtoCorrespondente ? `(${produtoCorrespondente.unidade})` : ''}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.quantidade}
              onChange={(e) => atualizarCampo('quantidade', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Preço unitário (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.preco_unitario}
              onChange={(e) => atualizarCampo('preco_unitario', e.target.value)}
            />
          </div>
        </div>

        <div className="linha-campos">
          <div className="campo">
            <label>Fornecedor</label>
            <input
              type="text"
              placeholder="Ex.: Auto Peças Recife"
              value={form.fornecedor}
              onChange={(e) => atualizarCampo('fornecedor', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Número da nota fiscal <span className="ajuda">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ex.: 12345"
              value={form.numero_nf}
              onChange={(e) => atualizarCampo('numero_nf', e.target.value)}
            />
          </div>
        </div>

        <div className="campo">
          <label>Responsável pela compra</label>
          <input
            type="text"
            list="lista-responsaveis-compra"
            placeholder="Digite o nome de quem está comprando"
            value={form.responsavel_nome}
            onChange={(e) => atualizarCampo('responsavel_nome', e.target.value)}
          />
          <datalist id="lista-responsaveis-compra">
            {responsaveis.map((r) => (
              <option key={r.id} value={r.nome} />
            ))}
          </datalist>
        </div>

        <div className="campo">
          <label>Observação <span className="ajuda">(opcional)</span></label>
          <textarea
            rows={2}
            placeholder="Alguma informação adicional sobre a compra"
            value={form.observacao}
            onChange={(e) => atualizarCampo('observacao', e.target.value)}
          />
        </div>

        <div style={estilos.totalBox}>
          <span>Valor total</span>
          <span style={estilos.totalValor} className="dado">{formatarMoeda(total)}</span>
        </div>

        <button type="submit" className="botao botao-primario" disabled={enviando} style={{ width: '100%', marginTop: 14 }}>
          {enviando ? 'Enviando...' : 'ENVIAR PARA APROVAÇÃO'}
        </button>
      </form>
    </div>
  )
}

const estilos = {
  totalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--cor-primaria-clara)',
    borderRadius: 'var(--raio-pequeno)',
    padding: '14px 16px',
    marginTop: 6,
    fontWeight: 600,
  },
  totalValor: {
    fontSize: '1.25rem',
    color: 'var(--cor-primaria-escura)',
  },
}

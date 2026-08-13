import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

const UNIDADES = [
  { valor: 'Unidade', rotulo: 'Unidade (un)' },
  { valor: 'Litro', rotulo: 'Litro (L)' },
  { valor: 'Quilograma', rotulo: 'Quilograma (kg)' },
  { valor: 'Metro', rotulo: 'Metro (m)' },
]

export default function CadastrarPeca() {
  const navegar = useNavigate()
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState({
    nome: '',
    categoria_nome: '',
    unidade: '',
    ncm_sh: '',
    estoque_atual: '',
    estoque_minimo: '',
  })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    api.listarCategorias().then(setCategorias).catch(() => {})
  }, [])

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!form.nome.trim() || !form.categoria_nome.trim() || !form.unidade) {
      setErro('Preencha nome, categoria e unidade.')
      return
    }

    setEnviando(true)
    try {
      await api.criarProduto({
        nome: form.nome.trim(),
        categoria_nome: form.categoria_nome.trim(),
        unidade: form.unidade,
        ncm_sh: form.ncm_sh.trim() || null,
        estoque_atual: form.estoque_atual ? Number(form.estoque_atual) : 0,
        estoque_minimo: form.estoque_minimo ? Number(form.estoque_minimo) : 0,
      })
      setSucesso('Peça cadastrada com sucesso! Ela já aparece no estoque.')
      setForm({ nome: '', categoria_nome: '', unidade: '', ncm_sh: '', estoque_atual: '', estoque_minimo: '' })
      api.listarCategorias().then(setCategorias).catch(() => {})
    } catch (e) {
      setErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pagina pagina-estreita">
      <div className="cabecalho-pagina">
        <h1>➕ Cadastrar peça</h1>
        <p className="subtitulo">Preencha os dados abaixo para adicionar um novo produto</p>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}
      {sucesso && (
        <div className="mensagem-sucesso">
          {sucesso}{' '}
          <button className="botao-texto" style={{ padding: 0, textDecoration: 'underline' }} onClick={() => navegar('/estoque')}>
            Ver estoque
          </button>
        </div>
      )}

      <form onSubmit={enviar} className="cartao">
        <div className="campo">
          <label>Nome da peça / produto</label>
          <input
            type="text"
            placeholder="Ex.: Óleo 15W40"
            value={form.nome}
            onChange={(e) => atualizarCampo('nome', e.target.value)}
          />
        </div>

        <div className="campo">
          <label>Categoria</label>
          <input
            type="text"
            placeholder="Ex.: Óleo"
            list="lista-categorias"
            value={form.categoria_nome}
            onChange={(e) => atualizarCampo('categoria_nome', e.target.value)}
          />
          <datalist id="lista-categorias">
            {categorias.map((c) => (
              <option key={c.id} value={c.nome} />
            ))}
          </datalist>
        </div>

        <div className="campo">
          <label>Unidade</label>
          <select value={form.unidade} onChange={(e) => atualizarCampo('unidade', e.target.value)}>
            <option value="">Selecione a unidade</option>
            {UNIDADES.map((u) => (
              <option key={u.valor} value={u.valor}>{u.rotulo}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>NCM-SH <span className="ajuda">(opcional)</span></label>
          <input
            type="text"
            placeholder="Opcional"
            value={form.ncm_sh}
            onChange={(e) => atualizarCampo('ncm_sh', e.target.value)}
          />
        </div>

        <div className="linha-campos">
          <div className="campo">
            <label>Estoque atual</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 0"
              value={form.estoque_atual}
              onChange={(e) => atualizarCampo('estoque_atual', e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Estoque mínimo</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 20"
              value={form.estoque_minimo}
              onChange={(e) => atualizarCampo('estoque_minimo', e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="botao botao-primario" disabled={enviando} style={{ width: '100%', marginTop: 8 }}>
          {enviando ? 'Salvando...' : 'Cadastrar peça'}
        </button>
      </form>
    </div>
  )
}

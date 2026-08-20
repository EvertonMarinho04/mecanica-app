import { useState } from 'react'

const UNIDADES = [
  { valor: 'Unidade', rotulo: 'Unidade (un)' },
  { valor: 'Litro', rotulo: 'Litro (L)' },
  { valor: 'Quilograma', rotulo: 'Quilograma (kg)' },
  { valor: 'Metro', rotulo: 'Metro (m)' },
]

export default function ModalEditarProduto({ produto, onCancelar, onConfirmar }) {
  const [form, setForm] = useState({
    nome: produto.nome,
    categoria_nome: produto.categoria.nome,
    unidade: produto.unidade,
    ncm_sh: produto.ncm_sh || '',
    estoque_minimo: produto.estoque_minimo,
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar() {
    if (!form.nome.trim() || !form.categoria_nome.trim() || !form.unidade) {
      setErro('Preencha nome, categoria e unidade.')
      return
    }
    setErro('')
    setSalvando(true)
    try {
      await onConfirmar({
        nome: form.nome.trim(),
        categoria_nome: form.categoria_nome.trim(),
        unidade: form.unidade,
        ncm_sh: form.ncm_sh.trim() || null,
        estoque_minimo: Number(form.estoque_minimo) || 0,
      })
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div style={estilos.fundo} onClick={onCancelar}>
      <div className="cartao" style={estilos.caixa} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 14 }}>Editar produto</h3>

        {erro && <div className="mensagem-erro">{erro}</div>}

        <div className="campo">
          <label>Nome da peça / produto</label>
          <input type="text" value={form.nome} onChange={(e) => atualizarCampo('nome', e.target.value)} />
        </div>
        <div className="campo">
          <label>Categoria</label>
          <input type="text" value={form.categoria_nome} onChange={(e) => atualizarCampo('categoria_nome', e.target.value)} />
        </div>
        <div className="campo">
          <label>Unidade</label>
          <select value={form.unidade} onChange={(e) => atualizarCampo('unidade', e.target.value)}>
            {UNIDADES.map((u) => (
              <option key={u.valor} value={u.valor}>{u.rotulo}</option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>NCM-SH <span className="ajuda">(opcional)</span></label>
          <input type="text" value={form.ncm_sh} onChange={(e) => atualizarCampo('ncm_sh', e.target.value)} />
        </div>
        <div className="campo">
          <label>Estoque mínimo</label>
          <input type="number" min="0" step="0.01" value={form.estoque_minimo} onChange={(e) => atualizarCampo('estoque_minimo', e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button className="botao botao-secundario" onClick={onCancelar} disabled={salvando}>Cancelar</button>
          <button className="botao botao-primario" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

const estilos = {
  fundo: {
    position: 'fixed', inset: 0, background: 'rgba(27, 50, 63, 0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
  },
  caixa: { maxWidth: 420, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
}

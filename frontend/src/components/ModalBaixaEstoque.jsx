import { useState } from 'react'

export default function ModalBaixaEstoque({ produto, onCancelar, onConfirmar }) {
  const [quantidade, setQuantidade] = useState('')
  const [erroLocal, setErroLocal] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function confirmar() {
    const valor = Number(quantidade)

    if (!quantidade || Number.isNaN(valor) || valor <= 0) {
      setErroLocal('Informe uma quantidade maior que zero.')
      return
    }
    if (valor > produto.quantidade_atual) {
      setErroLocal(`Você não pode retirar mais do que o estoque disponível (${produto.quantidade_atual} ${produto.unidade}).`)
      return
    }

    setErroLocal('')
    setEnviando(true)
    try {
      await onConfirmar(valor)
    } catch (e) {
      // Erro vindo da API (ex.: outro funcionario ja deu baixa nesse
      // meio tempo e o estoque mudou): mostramos aqui dentro do modal e
      // NAO fechamos, para o estoque exibido nao mudar de forma definitiva.
      setErroLocal(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={estilos.fundo} onClick={onCancelar}>
      <div className="cartao" style={estilos.caixa} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Dar baixa no estoque</h3>
        <p className="subtitulo" style={{ marginBottom: 16 }}>
          {produto.nome} — estoque atual: {produto.quantidade_atual} {produto.unidade}
        </p>

        {erroLocal && <div className="mensagem-erro">{erroLocal}</div>}

        <div className="campo">
          <label>Quantidade utilizada ({produto.unidade})</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 2"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="botao botao-secundario" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </button>
          <button className="botao botao-primario" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Salvando...' : 'Confirmar baixa'}
          </button>
        </div>
      </div>
    </div>
  )
}

const estilos = {
  fundo: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(27, 50, 63, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 50,
  },
  caixa: {
    maxWidth: 380,
    width: '100%',
  },
}

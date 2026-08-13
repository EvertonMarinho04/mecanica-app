export default function ModalConfirmacao({ titulo, mensagem, onCancelar, onConfirmar, confirmando }) {
  return (
    <div style={estilos.fundo} onClick={onCancelar}>
      <div className="cartao" style={estilos.caixa} onClick={(e) => e.stopPropagation()}>
        {titulo && <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{titulo}</h3>}
        <p style={{ color: 'var(--cor-texto-suave)', marginBottom: 20 }}>{mensagem}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="botao botao-secundario" onClick={onCancelar} disabled={confirmando}>
            Cancelar
          </button>
          <button className="botao botao-erro" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? 'Excluindo...' : 'Excluir'}
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

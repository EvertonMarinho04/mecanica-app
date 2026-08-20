const CONFIGURACAO = {
  pendente: { classe: 'etiqueta-alerta', texto: 'Pendente', ponto: '🟡' },
  aprovada: { classe: 'etiqueta-sucesso', texto: 'Aprovada', ponto: '🟢' },
  recusada: { classe: 'etiqueta-erro', texto: 'Recusada', ponto: '🔴' },
  parcialmente_recebida: { classe: 'etiqueta-alerta', texto: 'Parcialmente recebida', ponto: '🟡' },
  recebida: { classe: 'etiqueta-sucesso', texto: 'Recebida', ponto: '🟢' },
}

export default function BadgeStatus({ status }) {
  const config = CONFIGURACAO[status] || CONFIGURACAO.pendente
  return (
    <span className={`etiqueta ${config.classe}`}>
      {config.ponto} {config.texto}
    </span>
  )
}

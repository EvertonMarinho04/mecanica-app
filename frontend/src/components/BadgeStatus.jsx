const CONFIGURACAO = {
  pendente: { classe: 'etiqueta-alerta', texto: 'Pendente', ponto: '🟡' },
  aprovada: { classe: 'etiqueta-sucesso', texto: 'Aprovada', ponto: '🟢' },
  recusada: { classe: 'etiqueta-erro', texto: 'Recusada', ponto: '🔴' },
}

export default function BadgeStatus({ status }) {
  const config = CONFIGURACAO[status] || CONFIGURACAO.pendente
  return (
    <span className={`etiqueta ${config.classe}`}>
      {config.ponto} {config.texto}
    </span>
  )
}

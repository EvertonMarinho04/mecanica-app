export function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarData(isoString) {
  if (!isoString) return '—'
  const data = new Date(isoString)
  return data.toLocaleDateString('pt-BR')
}

export function formatarDataHora(isoString) {
  if (!isoString) return '—'
  const data = new Date(isoString)
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined) return null
  const sinal = valor > 0 ? '+' : ''
  return `${sinal}${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function formatarNumero(valor) {
  if (valor === null || valor === undefined) return '—'
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

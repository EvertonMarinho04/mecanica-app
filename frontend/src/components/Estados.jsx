export function Carregando({ texto = 'Carregando...' }) {
  return <div className="carregando">{texto}</div>
}

export function EstadoVazio({ texto }) {
  return <div className="estado-vazio">{texto}</div>
}

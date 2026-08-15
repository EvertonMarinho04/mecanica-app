import { Link } from 'react-router-dom'

const OPCOES = [
  { to: '/registrar-compra', icone: '🛒', titulo: 'Registrar compra', descricao: 'Envie uma compra para aprovação do administrador.' },
  { to: '/estoque', icone: '📦', titulo: 'Estoque', descricao: 'Veja a quantidade disponível de cada produto.' },
  { to: '/cadastrar-peca', icone: '➕', titulo: 'Cadastrar peça', descricao: 'Adicione um novo produto ao sistema.' },
  { to: '/ferramentas', icone: '🔧', titulo: 'Ferramentas', descricao: 'Consulte e atualize as ferramentas da oficina.' },
  { to: '/minhas-solicitacoes', icone: '📋', titulo: 'Minhas solicitações', descricao: 'Veja o status das compras que você pediu.' },
]

export default function Home() {
  return (
    <div className="pagina">
      <div className="cabecalho-pagina" style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1>O que você precisa fazer?</h1>
        <p className="subtitulo">Escolha uma opção abaixo</p>
      </div>

      <div style={estilos.grade}>
        {OPCOES.map((opcao) => (
          <Link key={opcao.to} to={opcao.to} className="cartao cartao-link" style={estilos.cartao}>
            <span style={estilos.icone}>{opcao.icone}</span>
            <div>
              <h2 style={estilos.titulo}>{opcao.titulo}</h2>
              <p className="subtitulo" style={{ marginTop: 4 }}>{opcao.descricao}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const estilos = {
  grade: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  cartao: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    textDecoration: 'none',
    color: 'inherit',
    transition: 'border-color 0.12s ease, transform 0.08s ease',
  },
  icone: {
    fontSize: '2.1rem',
  },
  titulo: {
    fontSize: '1.05rem',
  },
}

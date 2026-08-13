const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'mecanica_admin_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function limparToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, autenticado = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (autenticado) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const resposta = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (resposta.status === 204) return null

  let dados = null
  try {
    dados = await resposta.json()
  } catch {
    dados = null
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && autenticado) {
      limparToken()
    }
    const detalhe = (dados && dados.detail) || 'Ocorreu um erro. Tente novamente.'
    throw new Error(typeof detalhe === 'string' ? detalhe : 'Ocorreu um erro. Tente novamente.')
  }

  return dados
}

export const api = {
  // ---- publico (funcionarios) ----
  listarCategorias: () => request('/api/categorias'),
  listarProdutos: (busca) => request(`/api/produtos${busca ? `?busca=${encodeURIComponent(busca)}` : ''}`),
  criarProduto: (dados) => request('/api/produtos', { method: 'POST', body: dados }),
  excluirProduto: (id) => request(`/api/produtos/${id}`, { method: 'DELETE', autenticado: true }),
  listarResponsaveis: () => request('/api/responsaveis'),
  listarFerramentas: () => request('/api/ferramentas'),
  criarFerramenta: (dados) => request('/api/ferramentas', { method: 'POST', body: dados }),
  atualizarFerramenta: (id, dados) => request(`/api/ferramentas/${id}`, { method: 'PUT', body: dados }),
  excluirFerramenta: (id) => request(`/api/ferramentas/${id}`, { method: 'DELETE' }),
  registrarCompra: (dados) => request('/api/compras', { method: 'POST', body: dados }),

  // ---- admin ----
  login: (senha) => request('/api/admin/login', { method: 'POST', body: { senha } }),
  pendentes: () => request('/api/compras/pendentes', { autenticado: true }),
  detalheCompra: (id) => request(`/api/compras/${id}`, { autenticado: true }),
  aprovarCompra: (id) => request(`/api/compras/${id}/aprovar`, { method: 'POST', autenticado: true }),
  recusarCompra: (id, motivo) =>
    request(`/api/compras/${id}/recusar`, { method: 'POST', body: { motivo }, autenticado: true }),
  historicoCompras: (filtros = {}) => {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([chave, valor]) => {
      if (valor) params.set(chave, valor)
    })
    const query = params.toString()
    return request(`/api/compras${query ? `?${query}` : ''}`, { autenticado: true })
  },
  criarResponsavel: (dados) => request('/api/responsaveis', { method: 'POST', body: dados, autenticado: true }),
  resumoDashboard: () => request('/api/dashboard/resumo', { autenticado: true }),
  gastosMensais: () => request('/api/dashboard/gastos-mensais', { autenticado: true }),
  gastosPorCategoria: () => request('/api/dashboard/gastos-por-categoria', { autenticado: true }),
  maioresAumentos: () => request('/api/dashboard/maiores-aumentos', { autenticado: true }),
  maisComprados: () => request('/api/dashboard/mais-comprados', { autenticado: true }),
}

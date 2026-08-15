// Este sistema nao tem login individual para funcionarios (por decisao de
// projeto, para manter simples). Para a tela "Minhas solicitacoes" precisar
// saber "quem e o funcionario", usamos o mesmo nome que ele digita ao
// registrar uma compra - e guardamos so no navegador dele, para nao pedir
// de novo toda vez.
const CHAVE = 'mecanica_nome_funcionario'

export function obterMeuNome() {
  return localStorage.getItem(CHAVE) || ''
}

export function salvarMeuNome(nome) {
  if (nome && nome.trim()) {
    localStorage.setItem(CHAVE, nome.trim())
  }
}

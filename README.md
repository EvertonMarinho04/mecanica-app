# Controle de Compras e Estoque — Mecânica

Sistema web para controlar as compras de peças, óleos e materiais da mecânica de uma
distribuidora de água mineral (frota de ~28 caminhões). Funcionários registram
compras, o administrador aprova ou recusa, e o estoque é atualizado automaticamente
quando uma compra é aprovada.

## Como o sistema funciona (resumo)

- **Funcionários** não fazem login. Acessam direto a tela inicial e podem: registrar
  compras, ver o estoque, cadastrar peças e gerenciar ferramentas.
- **Administrador** acessa por um botão discreto (🔒 Área do administrador) protegido
  por senha. Só ele vê o dashboard financeiro, aprova/recusa compras e consulta o
  histórico e a análise de preços.
- Toda compra registrada por um funcionário fica **pendente** até o administrador
  aprovar ou recusar. Só quando aprovada é que o estoque é atualizado.

## Tecnologias utilizadas

- **Frontend:** React + Vite, React Router, Recharts (gráfico de comparação mensal)
- **Backend:** Python + FastAPI, SQLAlchemy, autenticação com JWT e senha em bcrypt
- **Banco de dados:** SQLite (arquivo único, sem necessidade de instalar servidor de
  banco de dados). A arquitetura usa SQLAlchemy, então é possível migrar para
  PostgreSQL apenas trocando a variável `DATABASE_URL` no `.env`, sem alterar código.

> **Por que SQLite em vez de PostgreSQL?** O pedido original permitia essa troca caso
> houvesse uma alternativa mais simples de manter. Como o sistema precisa ser fácil de
> instalar por alguém sem conhecimento técnico, SQLite elimina a necessidade de
> instalar e configurar um servidor de banco de dados separado — é só um arquivo
> (`mecanica.db`) criado automaticamente. Se no futuro a empresa quiser rodar em um
> servidor com múltiplos acessos simultâneos mais pesados, é só apontar o
> `DATABASE_URL` para um PostgreSQL.

## Estrutura do projeto

```
mecanica-app/
├── backend/
│   ├── app/
│   │   ├── main.py            # ponto de entrada da API
│   │   ├── database.py        # conexão com o banco
│   │   ├── models.py          # tabelas (SQLAlchemy)
│   │   ├── schemas.py         # validação de dados (Pydantic)
│   │   ├── auth.py            # login e proteção das rotas de admin
│   │   ├── utils.py           # cálculo de histórico/variação de preço
│   │   └── routers/           # rotas da API, uma por área
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/              # uma página por tela do sistema
    │   ├── components/         # peças reutilizáveis (badge de status, etc.)
    │   ├── context/             # estado de login do administrador
    │   ├── api.js               # todas as chamadas à API
    │   └── format.js            # formatação de moeda/data em pt-BR
    ├── package.json
    └── .env.example
```

## Como instalar e executar

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
```

Abra o `.env` criado e ajuste pelo menos:

- `ADMIN_PASSWORD` — a senha que o administrador vai usar para entrar na área
  administrativa (troque o valor de exemplo).
- `SECRET_KEY` — uma chave aleatória qualquer, usada para assinar o login. Pode gerar
  uma com `openssl rand -hex 32` ou apenas digitar um texto longo e aleatório.

As demais variáveis (`DATABASE_URL`, `CORS_ORIGINS`, etc.) já vêm com valores padrão
que funcionam para rodar localmente.

Depois, para rodar o backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Na primeira execução, o banco de dados (`mecanica.db`) é criado automaticamente,
junto com alguns produtos, responsáveis e ferramentas de exemplo (os mesmos usados
como exemplo no pedido original), para facilitar os primeiros testes. Isso só
acontece se o banco estiver vazio — não se repete depois.

A API fica disponível em `http://localhost:8000`. A documentação interativa (gerada
automaticamente pelo FastAPI) fica em `http://localhost:8000/docs`.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173` no navegador.

O arquivo `.env` do frontend só precisa apontar para onde o backend está rodando
(`VITE_API_URL=http://localhost:8000`, valor padrão já configurado).

## Credenciais e configurações necessárias

| Onde | O que configurar |
|---|---|
| `backend/.env` → `ADMIN_PASSWORD` | Senha de acesso à área administrativa. **Troque o valor de exemplo antes de usar em produção.** |
| `backend/.env` → `SECRET_KEY` | Chave usada para assinar o login do administrador. **Troque por um valor aleatório.** |
| `backend/.env` → `DATABASE_URL` | Caminho do banco. Padrão já funciona (SQLite local). |
| `frontend/.env` → `VITE_API_URL` | Endereço do backend. Padrão já funciona em ambiente local. |

Não existe senha nem usuário fixo no código — tudo vem do `.env`, que nunca deve ser
enviado para um repositório público (já está no `.gitignore`).

## Como testar o fluxo completo de uma compra

1. Acesse `http://localhost:5173` (tela inicial dos funcionários).
2. Clique em **➕ Cadastrar peça** (ou use um dos produtos de exemplo já cadastrados)
   e crie um produto novo.
3. Clique em **🛒 Registrar compra**, **digite** o nome exato do produto cadastrado
   (o campo sugere os nomes já existentes conforme você digita), informe quantidade,
   preço unitário, fornecedor e **digite** o nome do responsável pela compra, e envie.
   A compra fica com status **pendente** — o estoque ainda não muda.
4. Clique no botão discreto **🔒 Área do administrador** no topo da tela, digite a
   senha definida em `ADMIN_PASSWORD`.
5. No **Dashboard**, veja o card "🔔 Compras pendentes" indicando a nova compra, ou vá
   direto em **Compras pendentes** no menu.
6. Abra a compra: veja produto, quantidade, preço, fornecedor, estoque atual e (se
   já houver histórico de preço para esse produto) a comparação com o preço médio,
   com alerta ⚠️ caso esteja acima da média.
7. Clique em **✅ Aprovar** — o estoque do produto é atualizado automaticamente e a
   compra passa a aparecer em **Histórico** como aprovada. Ou clique em
   **❌ Recusar** (com motivo opcional) — nesse caso o estoque não muda.
8. Volte para **📦 Estoque** na área dos funcionários e confira que a quantidade foi
   atualizada (somente compras aprovadas mudam o estoque).

Esse fluxo completo foi testado ponta a ponta durante o desenvolvimento (registro →
pendente → alerta de preço → aprovação → estoque atualizado → histórico), assim como
o caminho de recusa (estoque permanece inalterado).

## O que foi implementado (V1)

- Tela inicial dos funcionários com as 4 opções (registrar compra, estoque, cadastrar
  peça, ferramentas), sem login e sem informações financeiras.
- Estoque com busca e aviso visual de estoque baixo (🔴/🟢).
- Cadastro de peças com os campos pedidos (nome, categoria, unidade — selecionada em
  lista fixa: un/L/kg/m —, NCM-SH opcional, estoque atual e estoque mínimo); categoria
  é criada automaticamente se ainda não existir.
- Registro de compra com cálculo automático do valor total; produto e responsável são
  digitados em texto livre (com sugestão automática dos já cadastrados). Se o produto
  digitado não existir no cadastro, o sistema recusa o registro com uma mensagem
  pedindo para cadastrar a peça antes; se o responsável for novo, é criado
  automaticamente.
- Exclusão de produtos no Estoque, restrita ao administrador logado, com modal de
  confirmação. Produtos que já têm compras registradas não podem ser excluídos (para
  preservar o histórico).
- Fluxo de aprovação/recusa: toda compra nasce pendente; só compras aprovadas entram
  no estoque; recusa aceita motivo opcional.
- Análise de preços: histórico por produto, variação percentual em relação à média
  histórica, e alerta visível apenas para o administrador na tela da compra.
- Área administrativa protegida por senha (hash bcrypt) e token JWT; rotas
  administrativas da API exigem token válido (retornam 401 sem ele).
- Dashboard com total gasto no mês, número de compras, itens em estoque e compras
  pendentes — os quatro cards agora são clicáveis: "Total gasto" e "Compras no mês"
  abrem a lista detalhada das compras do mês (produto, quantidade, preço, valor
  total, fornecedor, responsável, data e status); "Itens no estoque" abre a tela de
  estoque; "Compras pendentes" abre a lista de aprovação. Também mostra comparação de
  gastos dos últimos 6 meses (gráfico simples), gastos por categoria, produtos com
  maior aumento de preço e produtos mais comprados no mês.
- Histórico de compras com filtro por status, produto, responsável e período.
- Ferramentas: listar, adicionar, ajustar quantidade e excluir (sem QR code, sem
  empréstimo individual — como pedido).
- Banco de dados preparado para, futuramente, associar uma compra a um caminhão
  (campo já existe no modelo), sem tela dedicada nesta versão.
- Cabeçalho preparado para exibir a logo da empresa: basta salvar o arquivo
  `logo.png` em `frontend/public/` (veja `frontend/public/LOGO_AQUI.md`) — sem logo,
  mantém o ícone 🔧 como está hoje.

## O que ainda falta / próximos passos possíveis

- Logo oficial da empresa ainda não foi adicionada (estrutura já pronta, só falta o
  arquivo de imagem).
- Cadastro de caminhões e tela para associar compras a eles (fora do escopo da V1,
  por pedido explícito).
- Edição de peças e categorias já cadastradas (hoje só é possível criar e excluir
  produtos sem compras vinculadas).
- Não é possível excluir um produto que já tenha compras registradas — isso é
  intencional, para não perder o histórico financeiro, mas pode ser revisto se
  necessário.
- Se o funcionário digitar um nome de produto que não existe ao registrar uma
  compra, o sistema não cria o produto automaticamente — ele precisa cadastrar a
  peça primeiro. Essa foi a opção mais simples e segura para não criar produtos com
  dados incompletos (unidade, categoria, estoque mínimo).
- Paginação no histórico, caso o volume de compras cresça muito.
- Deploy em produção (hoje o projeto está pronto para rodar localmente; se subir para
  a internet, é preciso configurar HTTPS e trocar `CORS_ORIGINS` para o domínio real).
- Envio de notificação (e-mail, por exemplo) para o administrador quando uma nova
  compra fica pendente — hoje a indicação só aparece dentro do próprio sistema.
Projeto de sistema para oficina mecânica.
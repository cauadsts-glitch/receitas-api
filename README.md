# Receitas API — API de Receitas Culinárias

## 1. Nome e descrição do projeto

API REST para gerenciamento de **receitas culinárias** organizadas por **categorias** (massas, sobremesas, saladas etc.), com **avaliações** e **favoritos**.

- **Problema:** receitas costumam ficar espalhadas em cadernos, prints e sites, sem organização nem busca.
- **Domínio:** culinária / receitas.
- **Objetivo:** cadastrar, consultar, atualizar, remover e pesquisar categorias, receitas, avaliações e receitas favoritas, aplicando regras de negócio que mantêm os dados consistentes.

Projeto da Avaliação Final da disciplina de Desenvolvimento Back-end — Engenharia de Software.

## 2. Integrantes da equipe

- Cauã Oliveira dos Santos
- João Lucas Pires de Oliveira
- Gustavo Henrique Silva Poyer

## 3. Tecnologias utilizadas

- Node.js
- TypeScript
- Express 5
- Supabase (`@supabase/supabase-js`) / PostgreSQL
- Vitest + `@vitest/coverage-v8` (testes e cobertura)
- Supertest (testes de integração HTTP)
- Swagger UI / OpenAPI 3 (`swagger-ui-express`)
- tsx (execução em desenvolvimento)
- Git e GitHub Actions (CI)

## 4. Entidades e relacionamentos

Todas as entidades usam **UUID** como chave primária.

| Entidade | Principais atributos |
|---|---|
| **Category** (Categoria) | `id`, `name`, `description`, `icon`, `display_order`, `active`, `created_at` |
| **Receita** | `id`, `category_id`, `title`, `description`, `ingredients`, `instructions`, `prep_time_minutes`, `servings`, `difficulty` (`easy`/`medium`/`hard`), `image`, `active`, `created_at` |
| **Review** (Avaliação) | `id`, `receita_id`, `author_name`, `rating` (1 a 5), `comment`, `created_at` |
| **Favorite** (Favorito) | `id`, `receita_id` (único), `note`, `created_at` |

**Relacionamentos**

```
Category 1 ──── N Receita 1 ──── N Review
                      │
                      └──── 1 Favorite   (uma receita só pode ser favoritada uma vez)
```

- Uma Categoria possui várias Receitas; cada Receita pertence a uma Categoria (`receitas.category_id`).
- Uma Receita possui várias Avaliações (`reviews.receita_id`, `on delete cascade`).
- Uma Receita possui no máximo um Favorito (`favorites.receita_id` único, `on delete cascade`).

## 5. Regras de negócio

As regras ficam na camada de **Services** (`src/services`) e nos **Models** (`src/models`), sem depender do banco.

| Entidade | Regra | Resposta |
|---|---|---|
| Categoria | O nome é único (sem diferenciar maiúsculas/minúsculas) | `409` |
| Categoria | Não pode ser **desativada** se possuir receitas ativas | `422` |
| Categoria | Não pode ser **excluída** se possuir receitas vinculadas | `409` |
| Receita | A categoria informada deve existir | `404` |
| Receita | Uma receita **ativa** não pode ficar em categoria **inativa** | `422` |
| Receita | Não pode haver duas receitas com o mesmo título na mesma categoria | `409` |
| Receita | `difficulty` ∈ {`easy`, `medium`, `hard`}; `servings` e `prep_time_minutes` > 0 | `400` |
| Avaliação | A receita deve existir | `404` |
| Avaliação | Não é possível avaliar uma receita **inativa** | `422` |
| Avaliação | A nota (`rating`) é um inteiro de 1 a 5 | `400` |
| Favorito | A receita deve existir e estar ativa | `404` / `422` |
| Favorito | Uma receita só pode ser favoritada uma vez | `409` |
| Favorito | Na atualização, somente a anotação (`note`) pode mudar | — |
| Geral | IDs de rota devem ser UUIDs válidos | `400` |

## 6. Estrutura do projeto

```
src/
├── config/          # conexão com o Supabase (criada sob demanda)
├── controllers/     # recebem a requisição e devolvem a resposta HTTP
├── docs/            # especificação OpenAPI (Swagger)
├── errors/          # erros da aplicação (AppError e derivados)
├── middlewares/     # tratamento global de erros e rota não encontrada
├── models/          # classes de domínio: validação e encapsulamento dos dados
├── repositories/    # acesso ao banco (Supabase) — implementam as interfaces
├── routes/          # definição das rotas
├── services/        # regras de negócio
├── tests/
│   ├── helpers/     # fixtures, mocks e utilitários de teste
│   ├── integration/ # testes de integração (Supertest + Supabase)
│   ├── unit/        # testes unitários (Services, Models, HTTP com mocks)
│   └── setup.ts     # carrega as variáveis de ambiente dos testes
├── utils/           # funções de validação
├── app.ts           # monta o Express (createApp)
├── container.ts     # injeta repositórios nos services
└── server.ts        # inicia o servidor
database/
└── schema.sql       # script de criação das tabelas
postman/
└── receitas-api.postman_collection.json
```

Fluxo de uma requisição: **Route → Controller → Service → Repository → Supabase**. Os Services dependem apenas de *interfaces* de repositório, o que permite testá-los com mocks.

## 7. Configuração e execução

1. Clone o repositório e entre na pasta:
```bash
git clone https://github.com/cauadsts-glitch/receitas-api.git
cd receitas-api
```
2. Instale as dependências:
```bash
npm install
```
3. Crie as tabelas: abra o **SQL Editor** do Supabase e execute o script [`database/schema.sql`](database/schema.sql).
4. Configure as variáveis de ambiente copiando o arquivo de exemplo e preenchendo com os dados do seu projeto:
```bash
cp .env.example .env
```
5. Inicie a aplicação em modo de desenvolvimento:
```bash
npm run dev
```

O servidor inicia em `http://localhost:3000`. Para produção: `npm run build` e `npm start`.

## 8. Variáveis de ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `SUPABASE_URL` | URL do projeto no Supabase | Sim |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase (somente back-end) | Sim |
| `PORT` | Porta da API (padrão `3000`) | Não |

O arquivo [`.env.example`](.env.example) lista as variáveis com valores de exemplo. O arquivo `.env` (com credenciais reais) está no `.gitignore` e **não deve ser enviado ao Git**.

## 9. Banco de dados

Execute [`database/schema.sql`](database/schema.sql) no SQL Editor do Supabase (o script é idempotente).

**categories** — `id` (uuid, PK), `name` (obrigatório, único case-insensitive), `description`, `icon`, `display_order` (≥ 0), `active`, `created_at`

**receitas** — `id` (uuid, PK), `category_id` (uuid, **FK → categories.id**), `title`, `description`, `ingredients`, `instructions`, `prep_time_minutes` (> 0), `servings` (> 0), `difficulty` (`easy`/`medium`/`hard`), `image`, `active`, `created_at`. Único: (`category_id`, `lower(title)`).

**reviews** — `id` (uuid, PK), `receita_id` (uuid, **FK → receitas.id**, `on delete cascade`), `author_name`, `rating` (1 a 5), `comment`, `created_at`

**favorites** — `id` (uuid, PK), `receita_id` (uuid, **FK → receitas.id**, único, `on delete cascade`), `note`, `created_at`

## 10. Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Informações da API |
| GET | `/api-docs` | Documentação Swagger interativa |
| GET | `/categories` | Lista todas as categorias |
| GET | `/categories/search/:keyword` | Pesquisa categorias por nome/descrição |
| GET | `/categories/:id` | Consulta uma categoria pelo ID |
| POST | `/categories` | Cadastra uma categoria |
| PUT | `/categories/:id` | Atualiza uma categoria |
| DELETE | `/categories/:id` | Remove uma categoria |
| GET | `/receitas` | Lista todas as receitas |
| GET | `/receitas/search/:keyword` | Pesquisa receitas por título/descrição |
| GET | `/receitas/:id` | Consulta uma receita pelo ID |
| POST | `/receitas` | Cadastra uma receita |
| PUT | `/receitas/:id` | Atualiza uma receita |
| DELETE | `/receitas/:id` | Remove uma receita |
| GET | `/reviews` | Lista todas as avaliações |
| GET | `/reviews/search/:keyword` | Pesquisa avaliações por autor/comentário |
| GET | `/reviews/receita/:receitaId` | Lista as avaliações de uma receita |
| GET | `/reviews/:id` | Consulta uma avaliação pelo ID |
| POST | `/reviews` | Cadastra uma avaliação |
| PUT | `/reviews/:id` | Atualiza uma avaliação |
| DELETE | `/reviews/:id` | Remove uma avaliação |
| GET | `/favorites` | Lista os favoritos (com os dados da receita) |
| GET | `/favorites/:id` | Consulta um favorito pelo ID |
| POST | `/favorites` | Adiciona uma receita aos favoritos |
| PUT | `/favorites/:id` | Atualiza a anotação de um favorito |
| DELETE | `/favorites/:id` | Remove um favorito |

**Códigos de resposta**

| Código | Significado |
|---|---|
| `200` | Sucesso (consulta, atualização e exclusão) |
| `201` | Registro criado |
| `400` | Dados inválidos, ID que não é UUID ou JSON malformado |
| `404` | Registro ou rota não encontrados |
| `409` | Conflito (nome/título duplicado, receita já favoritada, categoria com receitas) |
| `422` | Regra de negócio violada (categoria/receita inativa, categoria com receitas ativas) |
| `500` | Erro interno |

As respostas de erro têm o formato `{ "message": "..." }`.

## 11. Exemplos de requisições

**POST /categories**

```json
{
  "name": "Sobremesas",
  "description": "Doces, bolos e tortas",
  "icon": "cake",
  "display_order": 1,
  "active": true
}
```

**POST /receitas** (`category_id` deve ser o UUID de uma categoria **ativa** existente)

```json
{
  "category_id": "UUID-DA-CATEGORIA",
  "title": "Bolo de cenoura",
  "description": "Bolo fofinho com cobertura de chocolate",
  "ingredients": "3 cenouras, 4 ovos, 1 xícara de óleo, 2 xícaras de açúcar, 2 xícaras de farinha, 1 colher de fermento",
  "instructions": "Bata no liquidificador as cenouras, os ovos e o óleo. Misture com o açúcar e a farinha, adicione o fermento e asse por 40 minutos a 180 °C.",
  "prep_time_minutes": 60,
  "servings": 10,
  "difficulty": "easy",
  "image": "https://exemplo.com/bolo-de-cenoura.jpg",
  "active": true
}
```

**PUT /receitas/:id** — enviar o objeto completo, com os mesmos campos do POST.

**POST /reviews** (`receita_id` deve ser uma receita **ativa**; `rating` de 1 a 5)

```json
{
  "receita_id": "UUID-DA-RECEITA",
  "author_name": "Maria Silva",
  "rating": 5,
  "comment": "Ficou macio e delicioso!"
}
```

**PUT /reviews/:id** — enviar o objeto completo, com os mesmos campos do POST.

**POST /favorites** (`note` é opcional)

```json
{
  "receita_id": "UUID-DA-RECEITA",
  "note": "Fazer no aniversário da família"
}
```

**PUT /favorites/:id** — atualiza apenas a anotação:

```json
{
  "note": "Trocar o açúcar por mascavo"
}
```

Uma coleção pronta para importar no Postman está em [`postman/receitas-api.postman_collection.json`](postman/receitas-api.postman_collection.json).

## 12. Testes automatizados e cobertura

**Ferramentas:** [Vitest](https://vitest.dev) (testes e mocks), [Supertest](https://github.com/ladjs/supertest) (requisições HTTP) e `@vitest/coverage-v8` (cobertura).

**Organização** (`src/tests`)

| Pasta | Conteúdo |
|---|---|
| `unit/` | Testes **unitários**: Services (com repositórios *mockados*), Models, validações, erros e a camada HTTP (rotas/controllers/middlewares com Services mockados). **Não usam o banco.** |
| `integration/` | Testes de **integração**: CRUD completo das 4 entidades via Supertest, contra o Supabase real (criar, listar, buscar por ID, atualizar, excluir, códigos HTTP, dados retornados e regras de negócio). |
| `helpers/` | Fixtures, mocks de repositórios e a classe `Cleanup`. |

**Comandos**

```bash
npm run test:unit         # somente testes unitários (não precisa de banco)
npm run test:integration  # somente testes de integração (precisa do banco de testes)
npm test                  # todos os testes
npm run test:coverage     # todos os testes + relatório de cobertura (mínimo 60%)
```

**Cobertura:** configurada em [`vitest.config.ts`](vitest.config.ts) com `thresholds` de **60%** para linhas, instruções, funções e branches — se qualquer métrica ficar abaixo, o comando falha. Somente a pasta `src/tests` é excluída da medição (nenhuma camada da aplicação é excluída). O relatório é gerado em `coverage/` (abra `coverage/index.html` no navegador; há também `lcov.info` e `coverage-summary.json`).

**Percentuais alcançados** *(preencher com o resultado de `npm run test:coverage`)*

| Métrica | Cobertura |
|---|---|
| Linhas (Lines) | __ % |
| Instruções (Statements) | __ % |
| Funções (Functions) | __ % |
| Ramificações (Branches) | __ % |

**Configuração e cuidados com o banco de testes**

- Os testes de integração **gravam no Supabase**. Use um projeto Supabase **separado** do de desenvolvimento (execute `database/schema.sql` nele também).
- Crie um arquivo `.env.test` (ignorado pelo Git) com `SUPABASE_URL` e `SUPABASE_SECRET_KEY` do banco de testes. Ele tem prioridade sobre o `.env`.
- Cada teste usa nomes únicos (sufixo aleatório) e a classe `Cleanup` remove tudo o que foi criado ao final (favoritos → avaliações → receitas → categorias), então os testes podem ser executados várias vezes sem interferência.
- Os arquivos de teste rodam em sequência (`fileParallelism: false`) para não competir pelo mesmo banco.
- Se as variáveis de ambiente do banco não estiverem configuradas, os testes de integração falham com uma mensagem explicando o que falta.

## 13. Documentação Swagger

Com a API em execução (`npm run dev`), acesse:

- **Interface interativa:** http://localhost:3000/api-docs
- **Especificação em JSON:** http://localhost:3000/api-docs.json

Na interface é possível ver todos os endpoints agrupados por entidade (Categorias, Receitas, Avaliações e Favoritos), com parâmetros, corpo esperado, exemplos e respostas. Para testar, abra um endpoint, clique em **Try it out**, edite o JSON de exemplo e clique em **Execute**.

## 14. CI (opcional)

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (GitHub Actions) compila o projeto e roda os testes com cobertura a cada push/pull request. Cadastre os *secrets* `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (de um projeto de **testes**) no repositório.

# Receitas API — API de Receitas Culinárias

## 1. Nome e descrição do projeto

API REST para gerenciamento de **receitas culinárias** organizadas por **categorias** (massas, sobremesas, saladas etc.).

- **Problema:** receitas costumam ficar espalhadas em cadernos, prints e sites, sem organização nem busca.
- **Domínio:** culinária / receitas.
- **Objetivo:** cadastrar, consultar, atualizar, remover e pesquisar categorias, receitas, avaliações e receitas favoritas.

Projeto da APS da disciplina de Desenvolvimento Back-end — Engenharia de Software.

## 2. Integrantes da equipe

- Cauã Oliveira dos Santos
- João Lucas


## 3. Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- Supabase (`@supabase/supabase-js`)
- PostgreSQL
- tsx
- Git

## 4. Entidades e relacionamento

**Category (Categoria):** `id`, `name`, `description`, `icon`, `display_order`, `active`

**Receita:** `id`, `category_id`, `title`, `description`, `ingredients`, `instructions`, `prep_time_minutes`, `servings`, `difficulty` (`easy`, `medium` ou `hard`), `image`, `active`

**Review (Avaliação):** `id`, `receita_id`, `author_name`, `rating` (inteiro de 1 a 5), `comment`

**Favorite (Favorito):** `id`, `receita_id` (único), `note`

**Relacionamentos:**
- Uma Categoria pode possuir várias Receitas e cada Receita pertence a uma Categoria (chave estrangeira `receitas.category_id`).
- Uma Receita pode possuir várias Avaliações e cada Avaliação pertence a uma Receita (chave estrangeira `reviews.receita_id`). Ao remover uma receita, suas avaliações são removidas junto (`on delete cascade`).
- Uma Receita pode ser favoritada uma única vez e cada Favorito pertence a uma Receita (chave estrangeira única `favorites.receita_id`). Ao remover uma receita, o favorito é removido junto.

## 5. Estrutura do projeto

```
src/
├── config/        # conexão com o Supabase
├── controllers/   # recebem as requisições e devolvem as respostas
├── models/        # acesso ao banco de dados
├── routes/        # definição das rotas
├── app.ts
└── server.ts
database/
└── schema.sql     # script de criação das tabelas
```

## 6. Configuração e execução
1. Clone o repositório e entre na pasta:
```bash
git clone https://github.com/cauadsts-glitch/receitas-api.git
cd receitas-api
```
2. Instale as dependências:
```bash
npm install
```
3. Crie as tabelas no banco: abra o SQL Editor do Supabase e execute o script `database/schema.sql`.
4. Configure as variáveis de ambiente: copie o arquivo de exemplo e preencha com os dados 
```bash
cp .env
```
5. Inicie a aplicação em modo de desenvolvimento:

```bash
npm run dev
```

O servidor inicia em `http://localhost:3000`.

## 7. Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto no Supabase |
| `SUPABASE_SECRET_KEY` | Chave secreta do Supabase |

O arquivo `.env` está no `.gitignore` e não deve ser enviado ao Git.

## 8. Banco de dados

Execute o script [`database/schema.sql`](database/schema.sql) no SQL Editor do Supabase.

**categories:** `id` (uuid, PK), `name` (obrigatório), `description`, `icon`, `display_order`, `active`, `created_at`

**receitas:** `id` (uuid, PK), `category_id` (uuid, FK → categories.id), `title`, `description`, `ingredients`, `instructions`, `prep_time_minutes`, `servings`, `difficulty`, `image`, `active`, `created_at`

**reviews:** `id` (uuid, PK), `receita_id` (uuid, FK → receitas.id, cascade), `author_name` (obrigatório), `rating` (1 a 5, obrigatório), `comment`, `created_at`

**favorites:** `id` (uuid, PK), `receita_id` (uuid, FK → receitas.id, único, cascade), `note`, `created_at`

## 9. Documentação dos endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /categories | Lista todas as categorias |
| GET | /categories/search/:keyword | Pesquisa categorias por palavra-chave |
| GET | /categories/:id | Consulta uma categoria pelo ID |
| POST | /categories | Cadastra uma nova categoria |
| PUT | /categories/:id | Atualiza uma categoria |
| DELETE | /categories/:id | Remove uma categoria |
| GET | /receitas | Lista todas as receitas |
| GET | /receitas/search/:keyword | Pesquisa receitas por palavra-chave (título/descrição) |
| GET | /receitas/:id | Consulta uma receita pelo ID |
| POST | /receitas | Cadastra uma nova receita |
| PUT | /receitas/:id | Atualiza uma receita |
| DELETE | /receitas/:id | Remove uma receita |
| GET | /reviews | Lista todas as avaliações |
| GET | /reviews/search/:keyword | Pesquisa avaliações por palavra-chave (autor/comentário) |
| GET | /reviews/receita/:receitaId | Lista as avaliações de uma receita |
| GET | /reviews/:id | Consulta uma avaliação pelo ID |
| POST | /reviews | Cadastra uma nova avaliação |
| PUT | /reviews/:id | Atualiza uma avaliação |
| DELETE | /reviews/:id | Remove uma avaliação |
| GET | /favorites | Lista as receitas favoritas (com os dados da receita) |
| GET | /favorites/:id | Consulta um favorito pelo ID |
| POST | /favorites | Adiciona uma receita aos favoritos |
| PUT | /favorites/:id | Atualiza a anotação de um favorito |
| DELETE | /favorites/:id | Remove uma receita dos favoritos |

**Códigos de resposta:** `200` sucesso · `201` criado · `400` dados ou ID não informados/inválidos · `404` não encontrado · `409` receita já favoritada · `500` erro interno.

## 10. Exemplos de requisições

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

**POST /receitas** (o `category_id` deve ser o UUID de uma categoria existente)

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

**POST /reviews** (o `receita_id` deve ser o UUID de uma receita existente; `rating` de 1 a 5)

```json
{
  "receita_id": "UUID-DA-RECEITA",
  "author_name": "Maria Silva",
  "rating": 5,
  "comment": "Ficou macio e delicioso!"
}
```

**PUT /reviews/:id** — enviar o objeto completo, com os mesmos campos do POST.

**POST /favorites** (o `receita_id` deve ser o UUID de uma receita existente; `note` é opcional)

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

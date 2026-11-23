/**
 * Especificação OpenAPI 3.0 da Receitas API.
 * Servida de forma interativa (Swagger UI) em /api-docs e em JSON em /api-docs.json.
 */

type Json = Record<string, unknown>;

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` });

const jsonContent = (schema: Json, example?: unknown): Json => ({
  "application/json": {
    schema,
    ...(example !== undefined ? { example } : {}),
  },
});

const errorResponse = (description: string, example: string): Json => ({
  description,
  content: jsonContent(ref("Error"), { message: example }),
});

const idParam = (label: string, name = "id"): Json => ({
  name,
  in: "path",
  required: true,
  description: `UUID ${label}`,
  schema: { type: "string", format: "uuid" },
});

const keywordParam: Json = {
  name: "keyword",
  in: "path",
  required: true,
  description: "Palavra-chave a ser pesquisada",
  schema: { type: "string" },
  example: "bolo",
};

const body = (schemaName: string, example: unknown): Json => ({
  required: true,
  content: jsonContent(ref(schemaName), example),
});

const listOf = (schemaName: string): Json => ({
  type: "array",
  items: ref(schemaName),
});

const messageExample = (message: string): Json =>
  jsonContent(ref("Message"), { message });

const EXAMPLE_UUID = "3f2b8c1e-5d4a-4e6b-9a7c-1b2c3d4e5f60";

interface CrudConfig {
  tag: string;
  base: string;
  singular: string;
  schema: string;
  createInput: string;
  updateInput: string;
  createExample: unknown;
  updateExample: unknown;
  withSearch?: boolean;
  searchSummary?: string;
  createErrors: Array<[string, string, string]>;
  updateErrors?: Array<[string, string, string]>;
  removeNotes?: Array<[string, string, string]>;
  removedMessage: string;
  listSummary: string;
}

function crudPaths(cfg: CrudConfig): Json {
  const idPath = `${cfg.base}/{id}`;
  const toResponses = (items: Array<[string, string, string]> = []): Json =>
    Object.fromEntries(
      items.map(([status, description, example]) => [
        status,
        errorResponse(description, example),
      ]),
    );

  const paths: Json = {
    [cfg.base]: {
      get: {
        tags: [cfg.tag],
        summary: cfg.listSummary,
        responses: {
          "200": {
            description: "Lista retornada com sucesso",
            content: jsonContent(listOf(cfg.schema)),
          },
          "500": errorResponse("Erro interno", "Erro ao acessar o banco de dados."),
        },
      },
      post: {
        tags: [cfg.tag],
        summary: `Cadastra ${cfg.singular}`,
        requestBody: body(cfg.createInput, cfg.createExample),
        responses: {
          "201": {
            description: "Cadastrado com sucesso",
            content: jsonContent(ref(cfg.schema)),
          },
          "400": errorResponse("Dados inválidos", "Dados inválidos."),
          ...toResponses(cfg.createErrors),
        },
      },
    },
    [idPath]: {
      get: {
        tags: [cfg.tag],
        summary: `Consulta ${cfg.singular} pelo ID`,
        parameters: [idParam(cfg.singular)],
        responses: {
          "200": {
            description: "Registro encontrado",
            content: jsonContent(ref(cfg.schema)),
          },
          "400": errorResponse("ID inválido", "ID inválido: informe um UUID válido."),
          "404": errorResponse("Não encontrado", "Registro não encontrado."),
        },
      },
      put: {
        tags: [cfg.tag],
        summary: `Atualiza ${cfg.singular}`,
        parameters: [idParam(cfg.singular)],
        requestBody: body(cfg.updateInput, cfg.updateExample),
        responses: {
          "200": {
            description: "Atualizado com sucesso",
            content: jsonContent(ref(cfg.schema)),
          },
          "400": errorResponse("Dados ou ID inválidos", "Dados inválidos."),
          "404": errorResponse("Não encontrado", "Registro não encontrado."),
          ...toResponses(cfg.updateErrors ?? cfg.createErrors.filter(([s]) => s !== "404")),
        },
      },
      delete: {
        tags: [cfg.tag],
        summary: `Remove ${cfg.singular}`,
        parameters: [idParam(cfg.singular)],
        responses: {
          "200": {
            description: "Removido com sucesso",
            content: messageExample(cfg.removedMessage),
          },
          "400": errorResponse("ID inválido", "ID inválido: informe um UUID válido."),
          "404": errorResponse("Não encontrado", "Registro não encontrado."),
          ...toResponses(cfg.removeNotes),
        },
      },
    },
  };

  if (cfg.withSearch) {
    paths[`${cfg.base}/search/{keyword}`] = {
      get: {
        tags: [cfg.tag],
        summary: cfg.searchSummary ?? "Pesquisa por palavra-chave",
        parameters: [keywordParam],
        responses: {
          "200": {
            description: "Resultados da pesquisa",
            content: jsonContent(listOf(cfg.schema)),
          },
          "400": errorResponse("Palavra-chave não informada", "Palavra-chave não informada."),
        },
      },
    };
  }

  return paths;
}

const categoryExample = {
  name: "Sobremesas",
  description: "Doces, bolos e tortas",
  icon: "cake",
  display_order: 1,
  active: true,
};

const receitaExample = {
  category_id: EXAMPLE_UUID,
  title: "Bolo de cenoura",
  description: "Bolo fofinho com cobertura de chocolate",
  ingredients:
    "3 cenouras, 4 ovos, 1 xícara de óleo, 2 xícaras de açúcar, 2 xícaras de farinha, 1 colher de fermento",
  instructions:
    "Bata no liquidificador as cenouras, os ovos e o óleo. Misture com o açúcar e a farinha, adicione o fermento e asse por 40 minutos a 180 °C.",
  prep_time_minutes: 60,
  servings: 10,
  difficulty: "easy",
  image: "https://exemplo.com/bolo-de-cenoura.jpg",
  active: true,
};

const reviewExample = {
  receita_id: EXAMPLE_UUID,
  author_name: "Maria Silva",
  rating: 5,
  comment: "Ficou macio e delicioso!",
};

const uuidProp: Json = { type: "string", format: "uuid" };
const dateProp: Json = { type: "string", format: "date-time" };

const schemas: Json = {
  Error: {
    type: "object",
    properties: { message: { type: "string" } },
    example: { message: "Categoria não encontrada." },
  },
  Message: {
    type: "object",
    properties: { message: { type: "string" } },
  },
  Category: {
    type: "object",
    properties: {
      id: uuidProp,
      name: { type: "string" },
      description: { type: "string", nullable: true },
      icon: { type: "string", nullable: true },
      display_order: { type: "integer" },
      active: { type: "boolean" },
      created_at: dateProp,
    },
  },
  CategoryInput: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", maxLength: 100, description: "Único (sem diferenciar maiúsculas/minúsculas)" },
      description: { type: "string" },
      icon: { type: "string" },
      display_order: { type: "integer", minimum: 0, default: 0 },
      active: { type: "boolean", default: true },
    },
  },
  Receita: {
    type: "object",
    properties: {
      id: uuidProp,
      category_id: uuidProp,
      title: { type: "string" },
      description: { type: "string", nullable: true },
      ingredients: { type: "string" },
      instructions: { type: "string" },
      prep_time_minutes: { type: "integer", nullable: true },
      servings: { type: "integer", nullable: true },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"], nullable: true },
      image: { type: "string", nullable: true },
      active: { type: "boolean" },
      created_at: dateProp,
    },
  },
  ReceitaInput: {
    type: "object",
    required: ["category_id", "title", "ingredients", "instructions"],
    properties: {
      category_id: { ...uuidProp, description: "UUID de uma categoria existente" },
      title: { type: "string" },
      description: { type: "string" },
      ingredients: { type: "string" },
      instructions: { type: "string" },
      prep_time_minutes: { type: "integer", minimum: 1 },
      servings: { type: "integer", minimum: 1 },
      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
      image: { type: "string" },
      active: { type: "boolean", default: true },
    },
  },
  Review: {
    type: "object",
    properties: {
      id: uuidProp,
      receita_id: uuidProp,
      author_name: { type: "string" },
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string", nullable: true },
      created_at: dateProp,
    },
  },
  ReviewInput: {
    type: "object",
    required: ["receita_id", "author_name", "rating"],
    properties: {
      receita_id: { ...uuidProp, description: "UUID de uma receita ativa" },
      author_name: { type: "string" },
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string" },
    },
  },
  Favorite: {
    type: "object",
    properties: {
      id: uuidProp,
      receita_id: uuidProp,
      note: { type: "string", nullable: true },
      created_at: dateProp,
      receitas: { ...ref("Receita"), description: "Dados da receita favoritada" },
    },
  },
  FavoriteInput: {
    type: "object",
    required: ["receita_id"],
    properties: {
      receita_id: { ...uuidProp, description: "UUID de uma receita ativa (cada receita só pode ser favoritada uma vez)" },
      note: { type: "string" },
    },
  },
  FavoriteNoteInput: {
    type: "object",
    properties: { note: { type: "string" } },
  },
};

const paths: Json = {
  "/": {
    get: {
      tags: ["Geral"],
      summary: "Informações da API",
      responses: {
        "200": {
          description: "API em execução",
          content: jsonContent(
            { type: "object" },
            { message: "Receitas API", version: "1.0.0", docs: "/api-docs" },
          ),
        },
      },
    },
  },
  ...crudPaths({
    tag: "Categorias",
    base: "/categories",
    singular: "a categoria",
    schema: "Category",
    createInput: "CategoryInput",
    updateInput: "CategoryInput",
    createExample: categoryExample,
    updateExample: { ...categoryExample, name: "Doces e Bolos" },
    withSearch: true,
    searchSummary: "Pesquisa categorias por nome ou descrição",
    listSummary: "Lista todas as categorias (ordenadas por display_order)",
    createErrors: [["409", "Já existe categoria com este nome", "Já existe uma categoria com este nome."]],
    updateErrors: [
      ["409", "Nome duplicado", "Já existe uma categoria com este nome."],
      ["422", "Categoria possui receitas ativas e não pode ser desativada", "Não é possível desativar uma categoria que possui receitas ativas."],
    ],
    removeNotes: [["409", "Categoria possui receitas vinculadas", "Não é possível excluir uma categoria que possui receitas vinculadas."]],
    removedMessage: "Categoria removida com sucesso!",
  }),
  ...crudPaths({
    tag: "Receitas",
    base: "/receitas",
    singular: "a receita",
    schema: "Receita",
    createInput: "ReceitaInput",
    updateInput: "ReceitaInput",
    createExample: receitaExample,
    updateExample: { ...receitaExample, title: "Bolo de cenoura com chocolate" },
    withSearch: true,
    searchSummary: "Pesquisa receitas por título ou descrição",
    listSummary: "Lista todas as receitas",
    createErrors: [
      ["404", "Categoria não encontrada", "Categoria não encontrada."],
      ["409", "Já existe receita com este título na categoria", "Já existe uma receita com este título nesta categoria."],
      ["422", "Categoria inativa", "Não é possível manter uma receita ativa em uma categoria inativa."],
    ],
    removedMessage: "Receita removida com sucesso!",
  }),
  ...crudPaths({
    tag: "Avaliações",
    base: "/reviews",
    singular: "a avaliação",
    schema: "Review",
    createInput: "ReviewInput",
    updateInput: "ReviewInput",
    createExample: reviewExample,
    updateExample: { ...reviewExample, rating: 4 },
    withSearch: true,
    searchSummary: "Pesquisa avaliações por autor ou comentário",
    listSummary: "Lista todas as avaliações",
    createErrors: [
      ["404", "Receita não encontrada", "Receita não encontrada."],
      ["422", "Receita inativa não pode ser avaliada", "Não é possível avaliar uma receita inativa."],
    ],
    removedMessage: "Avaliação removida com sucesso!",
  }),
  ...crudPaths({
    tag: "Favoritos",
    base: "/favorites",
    singular: "o favorito",
    schema: "Favorite",
    createInput: "FavoriteInput",
    updateInput: "FavoriteNoteInput",
    createExample: { receita_id: EXAMPLE_UUID, note: "Fazer no aniversário da família" },
    updateExample: { note: "Trocar o açúcar por mascavo" },
    listSummary: "Lista as receitas favoritas (com os dados da receita)",
    createErrors: [
      ["404", "Receita não encontrada", "Receita não encontrada."],
      ["409", "Receita já favoritada", "Esta receita já está nos favoritos."],
      ["422", "Receita inativa não pode ser favoritada", "Não é possível favoritar uma receita inativa."],
    ],
    updateErrors: [],
    removedMessage: "Favorito removido com sucesso!",
  }),
  "/reviews/receita/{receitaId}": {
    get: {
      tags: ["Avaliações"],
      summary: "Lista as avaliações de uma receita",
      parameters: [idParam("da receita", "receitaId")],
      responses: {
        "200": {
          description: "Avaliações da receita",
          content: jsonContent(listOf("Review")),
        },
        "400": errorResponse("ID inválido", "ID da receita inválido: informe um UUID válido."),
        "404": errorResponse("Receita não encontrada", "Receita não encontrada."),
      },
    },
  },
};

export const openApiDocument: Json = {
  openapi: "3.0.3",
  info: {
    title: "Receitas API",
    version: "1.0.0",
    description:
      "API REST para gerenciamento de receitas culinárias, organizadas por categorias, com avaliações e favoritos. " +
      "Projeto da Avaliação Final de Desenvolvimento Back-end (Node.js, TypeScript, Express e Supabase).",
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [
    { name: "Geral" },
    { name: "Categorias", description: "Categorias de receitas" },
    { name: "Receitas", description: "Receitas culinárias" },
    { name: "Avaliações", description: "Avaliações (notas de 1 a 5) das receitas" },
    { name: "Favoritos", description: "Receitas favoritas" },
  ],
  paths,
  components: { schemas },
};

import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../app.js";
import type { Services } from "../../container.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../errors/AppError.js";
import {
  ID_1,
  ID_2,
  ID_3,
  ID_4,
  makeCategory,
  makeFavorite,
  makeReceita,
  makeReview,
  validCategoryBody,
  validReceitaBody,
  validReviewBody,
} from "../helpers/fixtures.js";

/**
 * Testa a camada HTTP (rotas + controllers + middlewares) isolada do banco:
 * os Services são substituídos por mocks.
 */
function buildMockServices() {
  const crud = () => ({
    getAll: vi.fn(),
    getById: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  });

  return {
    categories: crud(),
    receitas: crud(),
    reviews: { ...crud(), getByReceita: vi.fn() },
    favorites: {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
}

describe("API HTTP (services mockados)", () => {
  let mocks: ReturnType<typeof buildMockServices>;
  let api: ReturnType<typeof request>;

  beforeEach(() => {
    mocks = buildMockServices();
    api = request(createApp(mocks as unknown as Services));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("geral", () => {
    it("GET / retorna informações da API", async () => {
      const res = await api.get("/");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ message: "Receitas API", docs: "/api-docs" });
    });

    it("GET /api-docs.json retorna a especificação OpenAPI", async () => {
      const res = await api.get("/api-docs.json");

      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe("3.0.3");
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining([
          "/categories",
          "/categories/{id}",
          "/receitas",
          "/receitas/{id}",
          "/reviews",
          "/reviews/{id}",
          "/reviews/receita/{receitaId}",
          "/favorites",
          "/favorites/{id}",
        ]),
      );
    });

    it("GET /api-docs/ serve a interface do Swagger", async () => {
      const res = await api.get("/api-docs/");

      expect(res.status).toBe(200);
      expect(res.text).toContain("swagger-ui");
    });

    it("retorna 404 para rota inexistente", async () => {
      const res = await api.get("/rota-que-nao-existe");

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Rota não encontrada");
    });

    it("retorna 400 para JSON malformado", async () => {
      const res = await api
        .post("/categories")
        .set("Content-Type", "application/json")
        .send("{json inválido");

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("JSON inválido no corpo da requisição.");
    });

    it("retorna 500 genérico para erros inesperados", async () => {
      mocks.categories.getAll.mockRejectedValue(new Error("falha secreta"));

      const res = await api.get("/categories");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Erro interno do servidor." });
    });
  });

  describe("/categories", () => {
    it("GET lista as categorias (200)", async () => {
      mocks.categories.getAll.mockResolvedValue([makeCategory()]);

      const res = await api.get("/categories");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("GET /search/:keyword pesquisa (200)", async () => {
      mocks.categories.search.mockResolvedValue([makeCategory()]);

      const res = await api.get("/categories/search/doce");

      expect(res.status).toBe(200);
      expect(mocks.categories.search).toHaveBeenCalledWith("doce");
    });

    it("GET /:id retorna a categoria (200)", async () => {
      mocks.categories.getById.mockResolvedValue(makeCategory());

      const res = await api.get(`/categories/${ID_1}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ID_1);
    });

    it("GET /:id devolve 404 quando não existe", async () => {
      mocks.categories.getById.mockRejectedValue(
        new NotFoundError("Categoria não encontrada."),
      );

      const res = await api.get(`/categories/${ID_1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Categoria não encontrada.");
    });

    it("POST cria a categoria (201)", async () => {
      mocks.categories.create.mockResolvedValue(makeCategory());

      const res = await api.post("/categories").send(validCategoryBody);

      expect(res.status).toBe(201);
      expect(mocks.categories.create).toHaveBeenCalledWith(validCategoryBody);
    });

    it("POST devolve 400 quando o service rejeita os dados", async () => {
      mocks.categories.create.mockRejectedValue(
        new ValidationError("O nome da categoria é obrigatório."),
      );

      const res = await api.post("/categories").send({});

      expect(res.status).toBe(400);
    });

    it("PUT atualiza (200)", async () => {
      mocks.categories.update.mockResolvedValue(makeCategory({ icon: "pie" }));

      const res = await api.put(`/categories/${ID_1}`).send(validCategoryBody);

      expect(res.status).toBe(200);
      expect(mocks.categories.update).toHaveBeenCalledWith(ID_1, validCategoryBody);
    });

    it("DELETE remove (200) com mensagem", async () => {
      mocks.categories.remove.mockResolvedValue(undefined);

      const res = await api.delete(`/categories/${ID_1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Categoria removida com sucesso!");
    });

    it("DELETE devolve 409 quando há receitas vinculadas", async () => {
      mocks.categories.remove.mockRejectedValue(
        new ConflictError("Categoria possui receitas."),
      );

      const res = await api.delete(`/categories/${ID_1}`);

      expect(res.status).toBe(409);
    });
  });

  describe("/receitas", () => {
    it("GET lista (200)", async () => {
      mocks.receitas.getAll.mockResolvedValue([makeReceita()]);

      expect((await api.get("/receitas")).status).toBe(200);
    });

    it("GET /search/:keyword pesquisa (200)", async () => {
      mocks.receitas.search.mockResolvedValue([]);

      expect((await api.get("/receitas/search/bolo")).status).toBe(200);
    });

    it("GET /:id retorna (200)", async () => {
      mocks.receitas.getById.mockResolvedValue(makeReceita());

      const res = await api.get(`/receitas/${ID_2}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(ID_2);
    });

    it("POST cria (201)", async () => {
      mocks.receitas.create.mockResolvedValue(makeReceita());

      expect((await api.post("/receitas").send(validReceitaBody)).status).toBe(201);
    });

    it("PUT atualiza (200)", async () => {
      mocks.receitas.update.mockResolvedValue(makeReceita());

      expect(
        (await api.put(`/receitas/${ID_2}`).send(validReceitaBody)).status,
      ).toBe(200);
    });

    it("DELETE remove (200)", async () => {
      mocks.receitas.remove.mockResolvedValue(undefined);

      const res = await api.delete(`/receitas/${ID_2}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Receita removida com sucesso!");
    });
  });

  describe("/reviews", () => {
    it("GET lista (200)", async () => {
      mocks.reviews.getAll.mockResolvedValue([makeReview()]);

      expect((await api.get("/reviews")).status).toBe(200);
    });

    it("GET /search/:keyword pesquisa (200)", async () => {
      mocks.reviews.search.mockResolvedValue([]);

      expect((await api.get("/reviews/search/maria")).status).toBe(200);
    });

    it("GET /receita/:receitaId lista por receita (200)", async () => {
      mocks.reviews.getByReceita.mockResolvedValue([makeReview()]);

      const res = await api.get(`/reviews/receita/${ID_2}`);

      expect(res.status).toBe(200);
      expect(mocks.reviews.getByReceita).toHaveBeenCalledWith(ID_2);
    });

    it("GET /:id retorna (200)", async () => {
      mocks.reviews.getById.mockResolvedValue(makeReview());

      expect((await api.get(`/reviews/${ID_3}`)).status).toBe(200);
    });

    it("POST cria (201)", async () => {
      mocks.reviews.create.mockResolvedValue(makeReview());

      expect((await api.post("/reviews").send(validReviewBody)).status).toBe(201);
    });

    it("PUT atualiza (200)", async () => {
      mocks.reviews.update.mockResolvedValue(makeReview());

      expect(
        (await api.put(`/reviews/${ID_3}`).send(validReviewBody)).status,
      ).toBe(200);
    });

    it("DELETE remove (200)", async () => {
      mocks.reviews.remove.mockResolvedValue(undefined);

      const res = await api.delete(`/reviews/${ID_3}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Avaliação removida com sucesso!");
    });
  });

  describe("/favorites", () => {
    it("GET lista (200)", async () => {
      mocks.favorites.getAll.mockResolvedValue([makeFavorite()]);

      expect((await api.get("/favorites")).status).toBe(200);
    });

    it("GET /:id retorna (200)", async () => {
      mocks.favorites.getById.mockResolvedValue(makeFavorite());

      expect((await api.get(`/favorites/${ID_4}`)).status).toBe(200);
    });

    it("POST cria (201)", async () => {
      mocks.favorites.create.mockResolvedValue(makeFavorite());

      const res = await api.post("/favorites").send({ receita_id: ID_2 });

      expect(res.status).toBe(201);
    });

    it("POST devolve 409 quando a receita já é favorita", async () => {
      mocks.favorites.create.mockRejectedValue(
        new ConflictError("Esta receita já está nos favoritos."),
      );

      const res = await api.post("/favorites").send({ receita_id: ID_2 });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe("Esta receita já está nos favoritos.");
    });

    it("PUT atualiza a anotação (200)", async () => {
      mocks.favorites.update.mockResolvedValue(makeFavorite({ note: "x" }));

      const res = await api.put(`/favorites/${ID_4}`).send({ note: "x" });

      expect(res.status).toBe(200);
    });

    it("DELETE remove (200)", async () => {
      mocks.favorites.remove.mockResolvedValue(undefined);

      const res = await api.delete(`/favorites/${ID_4}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Favorito removido com sucesso!");
    });
  });
});

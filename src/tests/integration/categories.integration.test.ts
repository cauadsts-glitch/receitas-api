import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import {
  Cleanup,
  UNKNOWN_ID,
  assertDatabaseEnv,
  unique,
} from "../helpers/integration.js";

describe("Integração - /categories", () => {
  const api = request(createApp());
  const cleanup = new Cleanup();
  const name = unique("TesteCategoria");
  let categoryId = "";

  beforeAll(() => assertDatabaseEnv());
  afterAll(() => cleanup.run(api));

  it("POST /categories cria uma categoria (201)", async () => {
    const res = await api
      .post("/categories")
      .send({ name, description: "Criada pelo teste", icon: "cake", display_order: 99 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name,
      description: "Criada pelo teste",
      display_order: 99,
      active: true,
    });
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);

    categoryId = res.body.id;
    cleanup.track("categories", categoryId);
  });

  it("POST /categories sem nome retorna 400", async () => {
    const res = await api.post("/categories").send({ description: "sem nome" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("O nome da categoria é obrigatório.");
  });

  it("POST /categories com nome repetido retorna 409", async () => {
    const res = await api.post("/categories").send({ name: name.toUpperCase() });

    expect(res.status).toBe(409);
  });

  it("GET /categories lista as categorias (200)", async () => {
    const res = await api.get("/categories");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { id: string }) => c.id === categoryId)).toBe(true);
  });

  it("GET /categories/:id retorna a categoria (200)", async () => {
    const res = await api.get(`/categories/${categoryId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: categoryId, name });
  });

  it("GET /categories/:id inexistente retorna 404", async () => {
    const res = await api.get(`/categories/${UNKNOWN_ID}`);

    expect(res.status).toBe(404);
  });

  it("GET /categories/:id com ID inválido retorna 400", async () => {
    const res = await api.get("/categories/nao-e-uuid");

    expect(res.status).toBe(400);
  });

  it("GET /categories/search/:keyword encontra pela palavra-chave (200)", async () => {
    const res = await api.get(`/categories/search/${name}`);

    expect(res.status).toBe(200);
    expect(res.body.some((c: { id: string }) => c.id === categoryId)).toBe(true);
  });

  it("PUT /categories/:id atualiza a categoria (200)", async () => {
    const res = await api
      .put(`/categories/${categoryId}`)
      .send({ name, description: "Descrição atualizada", display_order: 100 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: categoryId,
      description: "Descrição atualizada",
      display_order: 100,
    });
  });

  it("PUT /categories/:id inexistente retorna 404", async () => {
    const res = await api.put(`/categories/${UNKNOWN_ID}`).send({ name });

    expect(res.status).toBe(404);
  });

  it("PUT /categories/:id com dados inválidos retorna 400", async () => {
    const res = await api.put(`/categories/${categoryId}`).send({ name: "" });

    expect(res.status).toBe(400);
  });

  describe("regras de negócio", () => {
    let receitaId = "";

    beforeAll(async () => {
      const res = await api.post("/receitas").send({
        category_id: categoryId,
        title: unique("ReceitaDaCategoria"),
        ingredients: "ingrediente",
        instructions: "preparo",
      });

      receitaId = res.body.id;
      cleanup.track("receitas", receitaId);
    });

    it("não desativa categoria que possui receitas ativas (422)", async () => {
      const res = await api
        .put(`/categories/${categoryId}`)
        .send({ name, active: false });

      expect(res.status).toBe(422);
    });

    it("não exclui categoria que possui receitas (409)", async () => {
      const res = await api.delete(`/categories/${categoryId}`);

      expect(res.status).toBe(409);
    });

    it("exclui a categoria depois de remover as receitas (200)", async () => {
      await api.delete(`/receitas/${receitaId}`);

      const res = await api.delete(`/categories/${categoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Categoria removida com sucesso!");

      const after = await api.get(`/categories/${categoryId}`);
      expect(after.status).toBe(404);
    });
  });

  it("DELETE /categories/:id inexistente retorna 404", async () => {
    const res = await api.delete(`/categories/${UNKNOWN_ID}`);

    expect(res.status).toBe(404);
  });
});

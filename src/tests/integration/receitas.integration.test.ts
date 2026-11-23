import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import {
  Cleanup,
  UNKNOWN_ID,
  assertDatabaseEnv,
  unique,
} from "../helpers/integration.js";

describe("Integração - /receitas", () => {
  const api = request(createApp());
  const cleanup = new Cleanup();
  const title = unique("TesteReceita");
  let categoryId = "";
  let inactiveCategoryId = "";
  let receitaId = "";

  const body = (overrides: Record<string, unknown> = {}) => ({
    category_id: categoryId,
    title,
    description: "Receita criada pelo teste",
    ingredients: "2 ovos, 1 xícara de farinha",
    instructions: "Misture tudo e asse.",
    prep_time_minutes: 30,
    servings: 4,
    difficulty: "easy",
    ...overrides,
  });

  beforeAll(async () => {
    assertDatabaseEnv();

    const category = await api.post("/categories").send({ name: unique("CatReceitas") });
    categoryId = category.body.id;
    cleanup.track("categories", categoryId);

    const inactive = await api
      .post("/categories")
      .send({ name: unique("CatInativa"), active: false });
    inactiveCategoryId = inactive.body.id;
    cleanup.track("categories", inactiveCategoryId);
  });

  afterAll(() => cleanup.run(api));

  it("POST /receitas cria uma receita (201)", async () => {
    const res = await api.post("/receitas").send(body());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      category_id: categoryId,
      title,
      servings: 4,
      difficulty: "easy",
      active: true,
    });

    receitaId = res.body.id;
    cleanup.track("receitas", receitaId);
  });

  it("POST /receitas sem título retorna 400", async () => {
    const res = await api.post("/receitas").send(body({ title: "" }));

    expect(res.status).toBe(400);
  });

  it("POST /receitas com dificuldade inválida retorna 400", async () => {
    const res = await api
      .post("/receitas")
      .send(body({ title: unique("X"), difficulty: "impossivel" }));

    expect(res.status).toBe(400);
  });

  it("POST /receitas com porções zero retorna 400", async () => {
    const res = await api.post("/receitas").send(body({ title: unique("X"), servings: 0 }));

    expect(res.status).toBe(400);
  });

  it("POST /receitas com categoria inexistente retorna 404", async () => {
    const res = await api
      .post("/receitas")
      .send(body({ title: unique("X"), category_id: UNKNOWN_ID }));

    expect(res.status).toBe(404);
  });

  it("POST /receitas ativa em categoria inativa retorna 422", async () => {
    const res = await api
      .post("/receitas")
      .send(body({ title: unique("X"), category_id: inactiveCategoryId }));

    expect(res.status).toBe(422);
  });

  it("POST /receitas com título repetido na categoria retorna 409", async () => {
    const res = await api.post("/receitas").send(body());

    expect(res.status).toBe(409);
  });

  it("GET /receitas lista as receitas (200)", async () => {
    const res = await api.get("/receitas");

    expect(res.status).toBe(200);
    expect(res.body.some((r: { id: string }) => r.id === receitaId)).toBe(true);
  });

  it("GET /receitas/:id retorna a receita (200)", async () => {
    const res = await api.get(`/receitas/${receitaId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: receitaId, title });
  });

  it("GET /receitas/:id inexistente retorna 404", async () => {
    expect((await api.get(`/receitas/${UNKNOWN_ID}`)).status).toBe(404);
  });

  it("GET /receitas/:id com ID inválido retorna 400", async () => {
    expect((await api.get("/receitas/abc")).status).toBe(400);
  });

  it("GET /receitas/search/:keyword encontra pela palavra-chave (200)", async () => {
    const res = await api.get(`/receitas/search/${title}`);

    expect(res.status).toBe(200);
    expect(res.body.some((r: { id: string }) => r.id === receitaId)).toBe(true);
  });

  it("PUT /receitas/:id atualiza a receita (200)", async () => {
    const res = await api
      .put(`/receitas/${receitaId}`)
      .send(body({ servings: 8, difficulty: "medium" }));

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: receitaId, servings: 8, difficulty: "medium" });
  });

  it("PUT /receitas/:id inexistente retorna 404", async () => {
    expect((await api.put(`/receitas/${UNKNOWN_ID}`).send(body())).status).toBe(404);
  });

  it("PUT /receitas/:id com dados inválidos retorna 400", async () => {
    const res = await api.put(`/receitas/${receitaId}`).send(body({ ingredients: "" }));

    expect(res.status).toBe(400);
  });

  it("DELETE /receitas/:id remove a receita (200) e depois retorna 404", async () => {
    const res = await api.delete(`/receitas/${receitaId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Receita removida com sucesso!");

    expect((await api.get(`/receitas/${receitaId}`)).status).toBe(404);
  });

  it("DELETE /receitas/:id inexistente retorna 404", async () => {
    expect((await api.delete(`/receitas/${UNKNOWN_ID}`)).status).toBe(404);
  });
});

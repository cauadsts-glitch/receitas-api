import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import {
  Cleanup,
  UNKNOWN_ID,
  assertDatabaseEnv,
  unique,
} from "../helpers/integration.js";

describe("Integração - /favorites", () => {
  const api = request(createApp());
  const cleanup = new Cleanup();
  let receitaId = "";
  let inactiveReceitaId = "";
  let favoriteId = "";

  beforeAll(async () => {
    assertDatabaseEnv();

    const category = await api.post("/categories").send({ name: unique("CatFavoritos") });
    cleanup.track("categories", category.body.id);

    const receita = await api.post("/receitas").send({
      category_id: category.body.id,
      title: unique("ReceitaFavorita"),
      ingredients: "ingredientes",
      instructions: "preparo",
    });
    receitaId = receita.body.id;
    cleanup.track("receitas", receitaId);

    const inactive = await api.post("/receitas").send({
      category_id: category.body.id,
      title: unique("ReceitaInativa"),
      ingredients: "ingredientes",
      instructions: "preparo",
      active: false,
    });
    inactiveReceitaId = inactive.body.id;
    cleanup.track("receitas", inactiveReceitaId);
  });

  afterAll(() => cleanup.run(api));

  it("POST /favorites favorita uma receita (201)", async () => {
    const res = await api
      .post("/favorites")
      .send({ receita_id: receitaId, note: "Fazer no domingo" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ receita_id: receitaId, note: "Fazer no domingo" });

    favoriteId = res.body.id;
    cleanup.track("favorites", favoriteId);
  });

  it("POST /favorites sem receita_id retorna 400", async () => {
    expect((await api.post("/favorites").send({ note: "x" })).status).toBe(400);
  });

  it("POST /favorites com receita inexistente retorna 404", async () => {
    const res = await api.post("/favorites").send({ receita_id: UNKNOWN_ID });

    expect(res.status).toBe(404);
  });

  it("POST /favorites em receita inativa retorna 422", async () => {
    const res = await api.post("/favorites").send({ receita_id: inactiveReceitaId });

    expect(res.status).toBe(422);
  });

  it("POST /favorites repetido para a mesma receita retorna 409", async () => {
    const res = await api.post("/favorites").send({ receita_id: receitaId });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Esta receita já está nos favoritos.");
  });

  it("GET /favorites lista os favoritos com os dados da receita (200)", async () => {
    const res = await api.get("/favorites");

    expect(res.status).toBe(200);

    const found = res.body.find((f: { id: string }) => f.id === favoriteId);
    expect(found).toBeDefined();
    expect(found.receitas.id).toBe(receitaId);
  });

  it("GET /favorites/:id retorna o favorito (200)", async () => {
    const res = await api.get(`/favorites/${favoriteId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: favoriteId, receita_id: receitaId });
  });

  it("GET /favorites/:id inexistente retorna 404", async () => {
    expect((await api.get(`/favorites/${UNKNOWN_ID}`)).status).toBe(404);
  });

  it("GET /favorites/:id com ID inválido retorna 400", async () => {
    expect((await api.get("/favorites/abc")).status).toBe(400);
  });

  it("PUT /favorites/:id atualiza a anotação (200)", async () => {
    const res = await api.put(`/favorites/${favoriteId}`).send({ note: "Trocar por mascavo" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: favoriteId, note: "Trocar por mascavo" });
  });

  it("PUT /favorites/:id inexistente retorna 404", async () => {
    expect((await api.put(`/favorites/${UNKNOWN_ID}`).send({ note: "x" })).status).toBe(404);
  });

  it("DELETE /favorites/:id remove o favorito (200) e depois retorna 404", async () => {
    const res = await api.delete(`/favorites/${favoriteId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Favorito removido com sucesso!");

    expect((await api.get(`/favorites/${favoriteId}`)).status).toBe(404);
  });

  it("DELETE /favorites/:id inexistente retorna 404", async () => {
    expect((await api.delete(`/favorites/${UNKNOWN_ID}`)).status).toBe(404);
  });
});

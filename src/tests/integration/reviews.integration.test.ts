import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import {
  Cleanup,
  UNKNOWN_ID,
  assertDatabaseEnv,
  unique,
} from "../helpers/integration.js";

describe("Integração - /reviews", () => {
  const api = request(createApp());
  const cleanup = new Cleanup();
  const author = unique("Autor");
  let receitaId = "";
  let inactiveReceitaId = "";
  let reviewId = "";

  beforeAll(async () => {
    assertDatabaseEnv();

    const category = await api.post("/categories").send({ name: unique("CatReviews") });
    cleanup.track("categories", category.body.id);

    const receita = await api.post("/receitas").send({
      category_id: category.body.id,
      title: unique("ReceitaAvaliada"),
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

  it("POST /reviews cria uma avaliação (201)", async () => {
    const res = await api.post("/reviews").send({
      receita_id: receitaId,
      author_name: author,
      rating: 5,
      comment: "Excelente receita",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      receita_id: receitaId,
      author_name: author,
      rating: 5,
    });

    reviewId = res.body.id;
    cleanup.track("reviews", reviewId);
  });

  it.each([0, 6])("POST /reviews com nota %i retorna 400", async (rating) => {
    const res = await api
      .post("/reviews")
      .send({ receita_id: receitaId, author_name: author, rating });

    expect(res.status).toBe(400);
  });

  it("POST /reviews sem autor retorna 400", async () => {
    const res = await api.post("/reviews").send({ receita_id: receitaId, rating: 3 });

    expect(res.status).toBe(400);
  });

  it("POST /reviews com receita inexistente retorna 404", async () => {
    const res = await api
      .post("/reviews")
      .send({ receita_id: UNKNOWN_ID, author_name: author, rating: 3 });

    expect(res.status).toBe(404);
  });

  it("POST /reviews em receita inativa retorna 422", async () => {
    const res = await api
      .post("/reviews")
      .send({ receita_id: inactiveReceitaId, author_name: author, rating: 3 });

    expect(res.status).toBe(422);
  });

  it("GET /reviews lista as avaliações (200)", async () => {
    const res = await api.get("/reviews");

    expect(res.status).toBe(200);
    expect(res.body.some((r: { id: string }) => r.id === reviewId)).toBe(true);
  });

  it("GET /reviews/:id retorna a avaliação (200)", async () => {
    const res = await api.get(`/reviews/${reviewId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: reviewId, rating: 5 });
  });

  it("GET /reviews/:id inexistente retorna 404", async () => {
    expect((await api.get(`/reviews/${UNKNOWN_ID}`)).status).toBe(404);
  });

  it("GET /reviews/:id com ID inválido retorna 400", async () => {
    expect((await api.get("/reviews/abc")).status).toBe(400);
  });

  it("GET /reviews/receita/:receitaId lista as avaliações da receita (200)", async () => {
    const res = await api.get(`/reviews/receita/${receitaId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(reviewId);
  });

  it("GET /reviews/receita/:receitaId de receita inexistente retorna 404", async () => {
    expect((await api.get(`/reviews/receita/${UNKNOWN_ID}`)).status).toBe(404);
  });

  it("GET /reviews/search/:keyword encontra pelo autor (200)", async () => {
    const res = await api.get(`/reviews/search/${author}`);

    expect(res.status).toBe(200);
    expect(res.body.some((r: { id: string }) => r.id === reviewId)).toBe(true);
  });

  it("PUT /reviews/:id atualiza a avaliação (200)", async () => {
    const res = await api.put(`/reviews/${reviewId}`).send({
      receita_id: receitaId,
      author_name: author,
      rating: 3,
      comment: "Mudei de ideia",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: reviewId, rating: 3, comment: "Mudei de ideia" });
  });

  it("PUT /reviews/:id inexistente retorna 404", async () => {
    const res = await api
      .put(`/reviews/${UNKNOWN_ID}`)
      .send({ receita_id: receitaId, author_name: author, rating: 3 });

    expect(res.status).toBe(404);
  });

  it("PUT /reviews/:id com nota inválida retorna 400", async () => {
    const res = await api
      .put(`/reviews/${reviewId}`)
      .send({ receita_id: receitaId, author_name: author, rating: 10 });

    expect(res.status).toBe(400);
  });

  it("DELETE /reviews/:id remove a avaliação (200) e depois retorna 404", async () => {
    const res = await api.delete(`/reviews/${reviewId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Avaliação removida com sucesso!");

    expect((await api.get(`/reviews/${reviewId}`)).status).toBe(404);
  });

  it("DELETE /reviews/:id inexistente retorna 404", async () => {
    expect((await api.delete(`/reviews/${UNKNOWN_ID}`)).status).toBe(404);
  });
});

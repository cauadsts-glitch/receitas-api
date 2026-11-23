import { beforeEach, describe, expect, it } from "vitest";
import { ReviewService } from "../../services/ReviewService.js";
import {
  ID_2,
  ID_3,
  makeReceita,
  makeReview,
  mockReceitaRepo,
  mockReviewRepo,
  validReviewBody,
} from "../helpers/fixtures.js";

describe("ReviewService", () => {
  let reviews: ReturnType<typeof mockReviewRepo>;
  let receitas: ReturnType<typeof mockReceitaRepo>;
  let service: ReviewService;

  beforeEach(() => {
    reviews = mockReviewRepo();
    receitas = mockReceitaRepo();
    service = new ReviewService(reviews, receitas);
  });

  describe("consultas", () => {
    it("lista todas as avaliações", async () => {
      reviews.findAll.mockResolvedValue([makeReview()]);

      await expect(service.getAll()).resolves.toHaveLength(1);
    });

    it("retorna a avaliação pelo ID", async () => {
      reviews.findById.mockResolvedValue(makeReview());

      await expect(service.getById(ID_3)).resolves.toMatchObject({ id: ID_3 });
    });

    it("lança 404 quando a avaliação não existe", async () => {
      reviews.findById.mockResolvedValue(null);

      await expect(service.getById(ID_3)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 400 para ID inválido", async () => {
      await expect(service.getById("x")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("lista as avaliações de uma receita existente", async () => {
      receitas.findById.mockResolvedValue(makeReceita());
      reviews.findByReceita.mockResolvedValue([makeReview(), makeReview()]);

      await expect(service.getByReceita(ID_2)).resolves.toHaveLength(2);
    });

    it("lança 404 ao listar avaliações de receita inexistente", async () => {
      receitas.findById.mockResolvedValue(null);

      await expect(service.getByReceita(ID_2)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(reviews.findByReceita).not.toHaveBeenCalled();
    });

    it("lança 400 ao listar por receita com ID inválido", async () => {
      await expect(service.getByReceita("abc")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("pesquisa por palavra-chave", async () => {
      reviews.search.mockResolvedValue([makeReview()]);

      await expect(service.search(" maria ")).resolves.toHaveLength(1);
      expect(reviews.search).toHaveBeenCalledWith("maria");
    });

    it("lança 400 para palavra-chave vazia", async () => {
      await expect(service.search(" ")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("create", () => {
    it("cria a avaliação de uma receita ativa", async () => {
      receitas.findById.mockResolvedValue(makeReceita({ active: true }));
      reviews.create.mockResolvedValue(makeReview());

      const result = await service.create(validReviewBody);

      expect(reviews.create).toHaveBeenCalledWith(validReviewBody);
      expect(result.id).toBe(ID_3);
    });

    it.each([0, 6])("lança 400 para nota %i", async (rating) => {
      await expect(
        service.create({ ...validReviewBody, rating }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(receitas.findById).not.toHaveBeenCalled();
    });

    it("lança 404 quando a receita não existe", async () => {
      receitas.findById.mockResolvedValue(null);

      await expect(service.create(validReviewBody)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("não permite avaliar receita inativa (422)", async () => {
      receitas.findById.mockResolvedValue(makeReceita({ active: false }));

      await expect(service.create(validReviewBody)).rejects.toMatchObject({
        statusCode: 422,
        message: "Não é possível avaliar uma receita inativa.",
      });
      expect(reviews.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("atualiza a avaliação", async () => {
      reviews.findById.mockResolvedValue(makeReview());
      receitas.findById.mockResolvedValue(makeReceita());
      reviews.update.mockResolvedValue(makeReview({ rating: 3 }));

      const result = await service.update(ID_3, { ...validReviewBody, rating: 3 });

      expect(result.rating).toBe(3);
    });

    it("lança 404 quando a avaliação não existe", async () => {
      reviews.findById.mockResolvedValue(null);

      await expect(
        service.update(ID_3, validReviewBody),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("não permite mover a avaliação para receita inativa (422)", async () => {
      reviews.findById.mockResolvedValue(makeReview());
      receitas.findById.mockResolvedValue(makeReceita({ active: false }));

      await expect(
        service.update(ID_3, validReviewBody),
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it("lança 404 quando o update não encontra o registro", async () => {
      reviews.findById.mockResolvedValue(makeReview());
      receitas.findById.mockResolvedValue(makeReceita());
      reviews.update.mockResolvedValue(null);

      await expect(
        service.update(ID_3, validReviewBody),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("remove", () => {
    it("remove a avaliação", async () => {
      reviews.findById.mockResolvedValue(makeReview());
      reviews.delete.mockResolvedValue(true);

      await expect(service.remove(ID_3)).resolves.toBeUndefined();
    });

    it("lança 404 quando a avaliação não existe", async () => {
      reviews.findById.mockResolvedValue(null);

      await expect(service.remove(ID_3)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 404 quando o delete não remove nada", async () => {
      reviews.findById.mockResolvedValue(makeReview());
      reviews.delete.mockResolvedValue(false);

      await expect(service.remove(ID_3)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});

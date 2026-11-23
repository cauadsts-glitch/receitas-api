import { beforeEach, describe, expect, it } from "vitest";
import { FavoriteService } from "../../services/FavoriteService.js";
import {
  ID_2,
  ID_4,
  makeFavorite,
  makeReceita,
  mockFavoriteRepo,
  mockReceitaRepo,
} from "../helpers/fixtures.js";

describe("FavoriteService", () => {
  let favorites: ReturnType<typeof mockFavoriteRepo>;
  let receitas: ReturnType<typeof mockReceitaRepo>;
  let service: FavoriteService;

  beforeEach(() => {
    favorites = mockFavoriteRepo();
    receitas = mockReceitaRepo();
    service = new FavoriteService(favorites, receitas);
  });

  describe("consultas", () => {
    it("lista os favoritos", async () => {
      favorites.findAll.mockResolvedValue([makeFavorite()]);

      await expect(service.getAll()).resolves.toHaveLength(1);
    });

    it("retorna o favorito pelo ID", async () => {
      favorites.findById.mockResolvedValue(makeFavorite());

      await expect(service.getById(ID_4)).resolves.toMatchObject({ id: ID_4 });
    });

    it("lança 404 quando o favorito não existe", async () => {
      favorites.findById.mockResolvedValue(null);

      await expect(service.getById(ID_4)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 400 para ID inválido", async () => {
      await expect(service.getById("x")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("create", () => {
    it("favorita uma receita ativa ainda não favoritada", async () => {
      receitas.findById.mockResolvedValue(makeReceita());
      favorites.findByReceita.mockResolvedValue(null);
      favorites.create.mockResolvedValue(makeFavorite());

      const result = await service.create({ receita_id: ID_2, note: "Domingo" });

      expect(favorites.create).toHaveBeenCalledWith({
        receita_id: ID_2,
        note: "Domingo",
      });
      expect(result.id).toBe(ID_4);
    });

    it("lança 400 quando receita_id não é informado", async () => {
      await expect(service.create({})).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("lança 404 quando a receita não existe", async () => {
      receitas.findById.mockResolvedValue(null);

      await expect(service.create({ receita_id: ID_2 })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("não permite favoritar receita inativa (422)", async () => {
      receitas.findById.mockResolvedValue(makeReceita({ active: false }));

      await expect(service.create({ receita_id: ID_2 })).rejects.toMatchObject({
        statusCode: 422,
      });
      expect(favorites.create).not.toHaveBeenCalled();
    });

    it("não permite favoritar a mesma receita duas vezes (409)", async () => {
      receitas.findById.mockResolvedValue(makeReceita());
      favorites.findByReceita.mockResolvedValue(makeFavorite());

      await expect(service.create({ receita_id: ID_2 })).rejects.toMatchObject({
        statusCode: 409,
        message: "Esta receita já está nos favoritos.",
      });
      expect(favorites.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("atualiza somente a anotação", async () => {
      favorites.findById.mockResolvedValue(makeFavorite());
      favorites.update.mockResolvedValue(makeFavorite({ note: "Nova nota" }));

      const result = await service.update(ID_4, {
        note: "Nova nota",
        receita_id: "ignorado",
      });

      expect(favorites.update).toHaveBeenCalledWith(ID_4, { note: "Nova nota" });
      expect(result.note).toBe("Nova nota");
    });

    it("lança 404 quando o favorito não existe", async () => {
      favorites.findById.mockResolvedValue(null);

      await expect(service.update(ID_4, { note: "x" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 404 quando o update não encontra o registro", async () => {
      favorites.findById.mockResolvedValue(makeFavorite());
      favorites.update.mockResolvedValue(null);

      await expect(service.update(ID_4, { note: "x" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("remove", () => {
    it("remove o favorito", async () => {
      favorites.findById.mockResolvedValue(makeFavorite());
      favorites.delete.mockResolvedValue(true);

      await expect(service.remove(ID_4)).resolves.toBeUndefined();
    });

    it("lança 404 quando o favorito não existe", async () => {
      favorites.findById.mockResolvedValue(null);

      await expect(service.remove(ID_4)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 404 quando o delete não remove nada", async () => {
      favorites.findById.mockResolvedValue(makeFavorite());
      favorites.delete.mockResolvedValue(false);

      await expect(service.remove(ID_4)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});

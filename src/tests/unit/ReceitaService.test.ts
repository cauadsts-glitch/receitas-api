import { beforeEach, describe, expect, it } from "vitest";
import { ReceitaService } from "../../services/ReceitaService.js";
import {
  ID_1,
  ID_2,
  ID_3,
  makeCategory,
  makeReceita,
  mockCategoryRepo,
  mockReceitaRepo,
  validReceitaBody,
} from "../helpers/fixtures.js";

describe("ReceitaService", () => {
  let receitas: ReturnType<typeof mockReceitaRepo>;
  let categories: ReturnType<typeof mockCategoryRepo>;
  let service: ReceitaService;

  beforeEach(() => {
    receitas = mockReceitaRepo();
    categories = mockCategoryRepo();
    service = new ReceitaService(receitas, categories);
  });

  describe("getAll / getById / search", () => {
    it("lista todas as receitas", async () => {
      receitas.findAll.mockResolvedValue([makeReceita(), makeReceita()]);

      await expect(service.getAll()).resolves.toHaveLength(2);
    });

    it("retorna a receita pelo ID", async () => {
      receitas.findById.mockResolvedValue(makeReceita());

      await expect(service.getById(ID_2)).resolves.toMatchObject({ id: ID_2 });
    });

    it("lança 404 quando a receita não existe", async () => {
      receitas.findById.mockResolvedValue(null);

      await expect(service.getById(ID_2)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 400 para ID inválido", async () => {
      await expect(service.getById("x")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("pesquisa por palavra-chave", async () => {
      receitas.search.mockResolvedValue([makeReceita()]);

      await expect(service.search(" bolo ")).resolves.toHaveLength(1);
      expect(receitas.search).toHaveBeenCalledWith("bolo");
    });

    it("lança 400 para palavra-chave vazia", async () => {
      await expect(service.search("")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("create", () => {
    beforeEach(() => {
      categories.findById.mockResolvedValue(makeCategory());
      receitas.findByTitleInCategory.mockResolvedValue(null);
      receitas.create.mockResolvedValue(makeReceita());
    });

    it("cria a receita quando todas as regras são atendidas", async () => {
      const result = await service.create(validReceitaBody);

      expect(receitas.create).toHaveBeenCalledOnce();
      expect(result.id).toBe(ID_2);
    });

    it("lança 400 para dados inválidos", async () => {
      await expect(
        service.create({ ...validReceitaBody, difficulty: "x" }),
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(receitas.create).not.toHaveBeenCalled();
    });

    it("lança 404 quando a categoria não existe", async () => {
      categories.findById.mockResolvedValue(null);

      await expect(service.create(validReceitaBody)).rejects.toMatchObject({
        statusCode: 404,
        message: "Categoria não encontrada.",
      });
    });

    it("não permite receita ativa em categoria inativa (422)", async () => {
      categories.findById.mockResolvedValue(makeCategory({ active: false }));

      await expect(service.create(validReceitaBody)).rejects.toMatchObject({
        statusCode: 422,
      });
      expect(receitas.create).not.toHaveBeenCalled();
    });

    it("permite receita INATIVA em categoria inativa", async () => {
      categories.findById.mockResolvedValue(makeCategory({ active: false }));

      await service.create({ ...validReceitaBody, active: false });

      expect(receitas.create).toHaveBeenCalledOnce();
    });

    it("não permite título repetido na mesma categoria (409)", async () => {
      receitas.findByTitleInCategory.mockResolvedValue(makeReceita({ id: ID_3 }));

      await expect(service.create(validReceitaBody)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(receitas.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    beforeEach(() => {
      receitas.findById.mockResolvedValue(makeReceita());
      categories.findById.mockResolvedValue(makeCategory());
      receitas.findByTitleInCategory.mockResolvedValue(null);
    });

    it("atualiza a receita", async () => {
      receitas.update.mockResolvedValue(makeReceita({ title: "Novo" }));

      const result = await service.update(ID_2, {
        ...validReceitaBody,
        title: "Novo",
      });

      expect(result.title).toBe("Novo");
    });

    it("ignora a própria receita ao checar título duplicado", async () => {
      receitas.findByTitleInCategory.mockResolvedValue(makeReceita({ id: ID_2 }));
      receitas.update.mockResolvedValue(makeReceita());

      await expect(
        service.update(ID_2, validReceitaBody),
      ).resolves.toBeDefined();
    });

    it("lança 409 quando o título pertence a outra receita", async () => {
      receitas.findByTitleInCategory.mockResolvedValue(makeReceita({ id: ID_3 }));

      await expect(
        service.update(ID_2, validReceitaBody),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("lança 404 quando a receita não existe", async () => {
      receitas.findById.mockResolvedValue(null);

      await expect(
        service.update(ID_2, validReceitaBody),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("lança 404 quando o update não encontra o registro", async () => {
      receitas.update.mockResolvedValue(null);

      await expect(
        service.update(ID_2, validReceitaBody),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("remove", () => {
    it("remove a receita", async () => {
      receitas.findById.mockResolvedValue(makeReceita());
      receitas.delete.mockResolvedValue(true);

      await expect(service.remove(ID_2)).resolves.toBeUndefined();
    });

    it("lança 404 quando a receita não existe", async () => {
      receitas.findById.mockResolvedValue(null);

      await expect(service.remove(ID_2)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 404 quando o delete não remove nada", async () => {
      receitas.findById.mockResolvedValue(makeReceita());
      receitas.delete.mockResolvedValue(false);

      await expect(service.remove(ID_2)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  it("usa o ID da categoria informado ao validar as regras", async () => {
    categories.findById.mockResolvedValue(makeCategory());
    receitas.findByTitleInCategory.mockResolvedValue(null);
    receitas.create.mockResolvedValue(makeReceita());

    await service.create(validReceitaBody);

    expect(categories.findById).toHaveBeenCalledWith(ID_1);
    expect(receitas.findByTitleInCategory).toHaveBeenCalledWith(
      ID_1,
      "Bolo de cenoura",
    );
  });
});

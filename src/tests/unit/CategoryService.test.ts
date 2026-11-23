import { beforeEach, describe, expect, it } from "vitest";
import { CategoryService } from "../../services/CategoryService.js";
import {
  ID_1,
  ID_2,
  makeCategory,
  mockCategoryRepo,
  mockReceitaRepo,
  validCategoryBody,
} from "../helpers/fixtures.js";

describe("CategoryService", () => {
  let categories: ReturnType<typeof mockCategoryRepo>;
  let receitas: ReturnType<typeof mockReceitaRepo>;
  let service: CategoryService;

  beforeEach(() => {
    categories = mockCategoryRepo();
    receitas = mockReceitaRepo();
    service = new CategoryService(categories, receitas);
  });

  describe("getAll", () => {
    it("retorna todas as categorias", async () => {
      categories.findAll.mockResolvedValue([makeCategory()]);

      await expect(service.getAll()).resolves.toHaveLength(1);
    });
  });

  describe("getById", () => {
    it("retorna a categoria encontrada", async () => {
      categories.findById.mockResolvedValue(makeCategory());

      await expect(service.getById(ID_1)).resolves.toMatchObject({ id: ID_1 });
    });

    it("lança 404 quando não existe", async () => {
      categories.findById.mockResolvedValue(null);

      await expect(service.getById(ID_1)).rejects.toMatchObject({
        statusCode: 404,
        message: "Categoria não encontrada.",
      });
    });

    it("lança 400 quando o ID não é um UUID", async () => {
      await expect(service.getById("123")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(categories.findById).not.toHaveBeenCalled();
    });
  });

  describe("search", () => {
    it("pesquisa pela palavra-chave sem espaços extras", async () => {
      categories.search.mockResolvedValue([makeCategory()]);

      await service.search("  doce ");

      expect(categories.search).toHaveBeenCalledWith("doce");
    });

    it("lança 400 para palavra-chave vazia", async () => {
      await expect(service.search("   ")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("create", () => {
    it("cria a categoria quando o nome está livre", async () => {
      categories.findByName.mockResolvedValue(null);
      categories.create.mockResolvedValue(makeCategory());

      const result = await service.create(validCategoryBody);

      expect(categories.create).toHaveBeenCalledWith(validCategoryBody);
      expect(result.id).toBe(ID_1);
    });

    it("lança 409 quando já existe categoria com o mesmo nome", async () => {
      categories.findByName.mockResolvedValue(makeCategory());

      await expect(service.create(validCategoryBody)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(categories.create).not.toHaveBeenCalled();
    });

    it("lança 400 para dados inválidos sem consultar o banco", async () => {
      await expect(service.create({ name: "" })).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(categories.findByName).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("atualiza a categoria", async () => {
      categories.findById.mockResolvedValue(makeCategory());
      categories.findByName.mockResolvedValue(makeCategory());
      categories.update.mockResolvedValue(makeCategory({ icon: "pie" }));

      const result = await service.update(ID_1, {
        ...validCategoryBody,
        icon: "pie",
      });

      expect(result.icon).toBe("pie");
    });

    it("lança 404 quando a categoria não existe", async () => {
      categories.findById.mockResolvedValue(null);

      await expect(
        service.update(ID_1, validCategoryBody),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("lança 409 quando o nome pertence a outra categoria", async () => {
      categories.findById.mockResolvedValue(makeCategory());
      categories.findByName.mockResolvedValue(makeCategory({ id: ID_2 }));

      await expect(
        service.update(ID_1, validCategoryBody),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("não permite desativar categoria com receitas ativas (422)", async () => {
      categories.findById.mockResolvedValue(makeCategory({ active: true }));
      categories.findByName.mockResolvedValue(null);
      receitas.countByCategory.mockResolvedValue(2);

      await expect(
        service.update(ID_1, { ...validCategoryBody, active: false }),
      ).rejects.toMatchObject({
        statusCode: 422,
        message:
          "Não é possível desativar uma categoria que possui receitas ativas.",
      });
      expect(receitas.countByCategory).toHaveBeenCalledWith(ID_1, true);
      expect(categories.update).not.toHaveBeenCalled();
    });

    it("permite desativar categoria sem receitas ativas", async () => {
      categories.findById.mockResolvedValue(makeCategory({ active: true }));
      categories.findByName.mockResolvedValue(null);
      receitas.countByCategory.mockResolvedValue(0);
      categories.update.mockResolvedValue(makeCategory({ active: false }));

      const result = await service.update(ID_1, {
        ...validCategoryBody,
        active: false,
      });

      expect(result.active).toBe(false);
    });

    it("lança 404 quando a atualização não encontra o registro", async () => {
      categories.findById.mockResolvedValue(makeCategory());
      categories.findByName.mockResolvedValue(null);
      categories.update.mockResolvedValue(null);

      await expect(
        service.update(ID_1, validCategoryBody),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("remove", () => {
    it("remove a categoria sem receitas", async () => {
      categories.findById.mockResolvedValue(makeCategory());
      receitas.countByCategory.mockResolvedValue(0);
      categories.delete.mockResolvedValue(true);

      await expect(service.remove(ID_1)).resolves.toBeUndefined();
      expect(categories.delete).toHaveBeenCalledWith(ID_1);
    });

    it("não permite excluir categoria com receitas vinculadas (409)", async () => {
      categories.findById.mockResolvedValue(makeCategory());
      receitas.countByCategory.mockResolvedValue(3);

      await expect(service.remove(ID_1)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(categories.delete).not.toHaveBeenCalled();
    });

    it("lança 404 quando a categoria não existe", async () => {
      categories.findById.mockResolvedValue(null);

      await expect(service.remove(ID_1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lança 404 quando o delete não remove nada", async () => {
      categories.findById.mockResolvedValue(makeCategory());
      receitas.countByCategory.mockResolvedValue(0);
      categories.delete.mockResolvedValue(false);

      await expect(service.remove(ID_1)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});

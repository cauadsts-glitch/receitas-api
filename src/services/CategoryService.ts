import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { Category, type CategoryRecord } from "../models/Category.js";
import type {
  ICategoryRepository,
  IReceitaRepository,
} from "../repositories/interfaces.js";
import { assertUuid } from "../utils/validation.js";

/**
 * Regras de negócio de Categoria:
 *  - o nome da categoria é único (sem diferenciar maiúsculas/minúsculas);
 *  - não é possível desativar uma categoria que possui receitas ativas;
 *  - não é possível excluir uma categoria que possui receitas vinculadas.
 */
export class CategoryService {
  constructor(
    private readonly categories: ICategoryRepository,
    private readonly receitas: IReceitaRepository,
  ) {}

  async getAll(): Promise<CategoryRecord[]> {
    return this.categories.findAll();
  }

  async getById(id: string): Promise<CategoryRecord> {
    assertUuid(id, "ID da categoria");

    const category = await this.categories.findById(id);

    if (!category) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    return category;
  }

  async search(keyword: string): Promise<CategoryRecord[]> {
    if (!keyword || keyword.trim() === "") {
      throw new ValidationError("Palavra-chave não informada.");
    }

    return this.categories.search(keyword.trim());
  }

  async create(body: unknown): Promise<CategoryRecord> {
    const category = Category.fromInput(body);

    const duplicated = await this.categories.findByName(category.name);

    if (duplicated) {
      throw new ConflictError("Já existe uma categoria com este nome.");
    }

    return this.categories.create(category.toPersistence());
  }

  async update(id: string, body: unknown): Promise<CategoryRecord> {
    const current = await this.getById(id);
    const category = Category.fromInput(body);

    const duplicated = await this.categories.findByName(category.name);

    if (duplicated && duplicated.id !== id) {
      throw new ConflictError("Já existe uma categoria com este nome.");
    }

    if (current.active && !category.active) {
      const activeRecipes = await this.receitas.countByCategory(id, true);

      if (activeRecipes > 0) {
        throw new BusinessRuleError(
          "Não é possível desativar uma categoria que possui receitas ativas.",
        );
      }
    }

    const updated = await this.categories.update(id, category.toPersistence());

    if (!updated) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);

    const recipes = await this.receitas.countByCategory(id);

    if (recipes > 0) {
      throw new ConflictError(
        "Não é possível excluir uma categoria que possui receitas vinculadas.",
      );
    }

    const removed = await this.categories.delete(id);

    if (!removed) {
      throw new NotFoundError("Categoria não encontrada.");
    }
  }
}

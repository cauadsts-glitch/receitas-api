import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { Category } from "../models/Category.js";
import { Receita, type ReceitaRecord } from "../models/Receita.js";
import type {
  ICategoryRepository,
  IReceitaRepository,
} from "../repositories/interfaces.js";
import { assertUuid } from "../utils/validation.js";

/**
 * Regras de negócio de Receita:
 *  - a categoria informada precisa existir;
 *  - uma receita ativa não pode pertencer a uma categoria inativa;
 *  - não podem existir duas receitas com o mesmo título na mesma categoria.
 */
export class ReceitaService {
  constructor(
    private readonly receitas: IReceitaRepository,
    private readonly categories: ICategoryRepository,
  ) {}

  async getAll(): Promise<ReceitaRecord[]> {
    return this.receitas.findAll();
  }

  async getById(id: string): Promise<ReceitaRecord> {
    assertUuid(id, "ID da receita");

    const receita = await this.receitas.findById(id);

    if (!receita) {
      throw new NotFoundError("Receita não encontrada.");
    }

    return receita;
  }

  async search(keyword: string): Promise<ReceitaRecord[]> {
    if (!keyword || keyword.trim() === "") {
      throw new ValidationError("Palavra-chave não informada.");
    }

    return this.receitas.search(keyword.trim());
  }

  async create(body: unknown): Promise<ReceitaRecord> {
    const receita = Receita.fromInput(body);

    await this.ensureRules(receita);

    return this.receitas.create(receita.toPersistence());
  }

  async update(id: string, body: unknown): Promise<ReceitaRecord> {
    await this.getById(id);

    const receita = Receita.fromInput(body);

    await this.ensureRules(receita, id);

    const updated = await this.receitas.update(id, receita.toPersistence());

    if (!updated) {
      throw new NotFoundError("Receita não encontrada.");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);

    const removed = await this.receitas.delete(id);

    if (!removed) {
      throw new NotFoundError("Receita não encontrada.");
    }
  }

  private async ensureRules(receita: Receita, ignoreId?: string): Promise<void> {
    const category = await this.categories.findById(receita.categoryId);

    if (!category) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    if (receita.active && !Category.isAvailable(category)) {
      throw new BusinessRuleError(
        "Não é possível manter uma receita ativa em uma categoria inativa.",
      );
    }

    const duplicated = await this.receitas.findByTitleInCategory(
      receita.categoryId,
      receita.title,
    );

    if (duplicated && duplicated.id !== ignoreId) {
      throw new ConflictError(
        "Já existe uma receita com este título nesta categoria.",
      );
    }
  }
}

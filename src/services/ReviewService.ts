import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { Receita } from "../models/Receita.js";
import { Review, type ReviewRecord } from "../models/Review.js";
import type {
  IReceitaRepository,
  IReviewRepository,
} from "../repositories/interfaces.js";
import { assertUuid } from "../utils/validation.js";

/**
 * Regras de negócio de Avaliação:
 *  - a receita avaliada precisa existir;
 *  - não é possível avaliar uma receita inativa;
 *  - a nota é um inteiro de 1 a 5.
 */
export class ReviewService {
  constructor(
    private readonly reviews: IReviewRepository,
    private readonly receitas: IReceitaRepository,
  ) {}

  async getAll(): Promise<ReviewRecord[]> {
    return this.reviews.findAll();
  }

  async getById(id: string): Promise<ReviewRecord> {
    assertUuid(id, "ID da avaliação");

    const review = await this.reviews.findById(id);

    if (!review) {
      throw new NotFoundError("Avaliação não encontrada.");
    }

    return review;
  }

  async getByReceita(receitaId: string): Promise<ReviewRecord[]> {
    assertUuid(receitaId, "ID da receita");

    const receita = await this.receitas.findById(receitaId);

    if (!receita) {
      throw new NotFoundError("Receita não encontrada.");
    }

    return this.reviews.findByReceita(receitaId);
  }

  async search(keyword: string): Promise<ReviewRecord[]> {
    if (!keyword || keyword.trim() === "") {
      throw new ValidationError("Palavra-chave não informada.");
    }

    return this.reviews.search(keyword.trim());
  }

  async create(body: unknown): Promise<ReviewRecord> {
    const review = Review.fromInput(body);

    await this.ensureReceitaCanBeReviewed(review.receitaId);

    return this.reviews.create(review.toPersistence());
  }

  async update(id: string, body: unknown): Promise<ReviewRecord> {
    await this.getById(id);

    const review = Review.fromInput(body);

    await this.ensureReceitaCanBeReviewed(review.receitaId);

    const updated = await this.reviews.update(id, review.toPersistence());

    if (!updated) {
      throw new NotFoundError("Avaliação não encontrada.");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);

    const removed = await this.reviews.delete(id);

    if (!removed) {
      throw new NotFoundError("Avaliação não encontrada.");
    }
  }

  private async ensureReceitaCanBeReviewed(receitaId: string): Promise<void> {
    const receita = await this.receitas.findById(receitaId);

    if (!receita) {
      throw new NotFoundError("Receita não encontrada.");
    }

    if (!Receita.isAvailable(receita)) {
      throw new BusinessRuleError(
        "Não é possível avaliar uma receita inativa.",
      );
    }
  }
}

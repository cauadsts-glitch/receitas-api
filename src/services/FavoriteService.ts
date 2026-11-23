import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "../errors/AppError.js";
import { Favorite, type FavoriteRecord } from "../models/Favorite.js";
import { Receita } from "../models/Receita.js";
import type {
  IFavoriteRepository,
  IReceitaRepository,
} from "../repositories/interfaces.js";
import { assertUuid } from "../utils/validation.js";

/**
 * Regras de negócio de Favorito:
 *  - a receita precisa existir;
 *  - não é possível favoritar uma receita inativa;
 *  - uma receita só pode ser favoritada uma vez;
 *  - na atualização, apenas a anotação pode ser alterada.
 */
export class FavoriteService {
  constructor(
    private readonly favorites: IFavoriteRepository,
    private readonly receitas: IReceitaRepository,
  ) {}

  async getAll(): Promise<FavoriteRecord[]> {
    return this.favorites.findAll();
  }

  async getById(id: string): Promise<FavoriteRecord> {
    assertUuid(id, "ID do favorito");

    const favorite = await this.favorites.findById(id);

    if (!favorite) {
      throw new NotFoundError("Favorito não encontrado.");
    }

    return favorite;
  }

  async create(body: unknown): Promise<FavoriteRecord> {
    const favorite = Favorite.fromInput(body);

    const receita = await this.receitas.findById(favorite.receitaId);

    if (!receita) {
      throw new NotFoundError("Receita não encontrada.");
    }

    if (!Receita.isAvailable(receita)) {
      throw new BusinessRuleError(
        "Não é possível favoritar uma receita inativa.",
      );
    }

    const alreadyFavorite = await this.favorites.findByReceita(
      favorite.receitaId,
    );

    if (alreadyFavorite) {
      throw new ConflictError("Esta receita já está nos favoritos.");
    }

    return this.favorites.create(favorite.toPersistence());
  }

  async update(id: string, body: unknown): Promise<FavoriteRecord> {
    await this.getById(id);

    const note = Favorite.parseNoteUpdate(body);

    const updated = await this.favorites.update(id, { note });

    if (!updated) {
      throw new NotFoundError("Favorito não encontrado.");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.getById(id);

    const removed = await this.favorites.delete(id);

    if (!removed) {
      throw new NotFoundError("Favorito não encontrado.");
    }
  }
}

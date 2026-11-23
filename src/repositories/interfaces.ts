import type { CategoryData, CategoryRecord } from "../models/Category.js";
import type { FavoriteData, FavoriteRecord } from "../models/Favorite.js";
import type { ReceitaData, ReceitaRecord } from "../models/Receita.js";
import type { ReviewData, ReviewRecord } from "../models/Review.js";

/**
 * Contratos da camada de persistência. Os Services dependem apenas destas
 * interfaces, o que permite trocar o Supabase por mocks nos testes unitários.
 */
export interface IRepository<TRecord, TData> {
  findAll(): Promise<TRecord[]>;
  findById(id: string): Promise<TRecord | null>;
  create(data: TData): Promise<TRecord>;
  update(id: string, data: Partial<TData>): Promise<TRecord | null>;
  /** Retorna `true` se algum registro foi removido. */
  delete(id: string): Promise<boolean>;
}

export interface ICategoryRepository
  extends IRepository<CategoryRecord, CategoryData> {
  findByName(name: string): Promise<CategoryRecord | null>;
  search(keyword: string): Promise<CategoryRecord[]>;
}

export interface IReceitaRepository
  extends IRepository<ReceitaRecord, ReceitaData> {
  findByTitleInCategory(
    categoryId: string,
    title: string,
  ): Promise<ReceitaRecord | null>;
  countByCategory(categoryId: string, onlyActive?: boolean): Promise<number>;
  search(keyword: string): Promise<ReceitaRecord[]>;
}

export interface IReviewRepository
  extends IRepository<ReviewRecord, ReviewData> {
  findByReceita(receitaId: string): Promise<ReviewRecord[]>;
  search(keyword: string): Promise<ReviewRecord[]>;
}

export interface IFavoriteRepository
  extends IRepository<FavoriteRecord, FavoriteData> {
  findByReceita(receitaId: string): Promise<FavoriteRecord | null>;
}

import { vi, type Mock } from "vitest";
import type { CategoryRecord } from "../../models/Category.js";
import type { FavoriteRecord } from "../../models/Favorite.js";
import type { ReceitaRecord } from "../../models/Receita.js";
import type { ReviewRecord } from "../../models/Review.js";
import type {
  ICategoryRepository,
  IFavoriteRepository,
  IReceitaRepository,
  IReviewRepository,
} from "../../repositories/interfaces.js";

export const ID_1 = "11111111-1111-4111-8111-111111111111";
export const ID_2 = "22222222-2222-4222-8222-222222222222";
export const ID_3 = "33333333-3333-4333-8333-333333333333";
export const ID_4 = "44444444-4444-4444-8444-444444444444";

export const makeCategory = (
  overrides: Partial<CategoryRecord> = {},
): CategoryRecord => ({
  id: ID_1,
  name: "Sobremesas",
  description: "Doces e bolos",
  icon: "cake",
  display_order: 1,
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

export const makeReceita = (
  overrides: Partial<ReceitaRecord> = {},
): ReceitaRecord => ({
  id: ID_2,
  category_id: ID_1,
  title: "Bolo de cenoura",
  description: "Bolo fofinho",
  ingredients: "cenoura, ovos, farinha",
  instructions: "Bata tudo e asse por 40 minutos.",
  prep_time_minutes: 60,
  servings: 10,
  difficulty: "easy",
  image: null,
  active: true,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

export const makeReview = (
  overrides: Partial<ReviewRecord> = {},
): ReviewRecord => ({
  id: ID_3,
  receita_id: ID_2,
  author_name: "Maria",
  rating: 5,
  comment: "Delicioso",
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

export const makeFavorite = (
  overrides: Partial<FavoriteRecord> = {},
): FavoriteRecord => ({
  id: ID_4,
  receita_id: ID_2,
  note: "Fazer no domingo",
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

/** Corpos de requisição válidos. */
export const validCategoryBody = {
  name: "Sobremesas",
  description: "Doces e bolos",
  icon: "cake",
  display_order: 1,
  active: true,
};

export const validReceitaBody = {
  category_id: ID_1,
  title: "Bolo de cenoura",
  description: "Bolo fofinho",
  ingredients: "cenoura, ovos, farinha",
  instructions: "Bata tudo e asse por 40 minutos.",
  prep_time_minutes: 60,
  servings: 10,
  difficulty: "easy",
  image: "https://exemplo.com/bolo.jpg",
  active: true,
};

export const validReviewBody = {
  receita_id: ID_2,
  author_name: "Maria",
  rating: 5,
  comment: "Delicioso",
};

type MockedRepo<T> = { [K in keyof T]: Mock };

export function mockCategoryRepo(): MockedRepo<ICategoryRepository> {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByName: vi.fn(),
    search: vi.fn(),
  };
}

export function mockReceitaRepo(): MockedRepo<IReceitaRepository> {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByTitleInCategory: vi.fn(),
    countByCategory: vi.fn(),
    search: vi.fn(),
  };
}

export function mockReviewRepo(): MockedRepo<IReviewRepository> {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByReceita: vi.fn(),
    search: vi.fn(),
  };
}

export function mockFavoriteRepo(): MockedRepo<IFavoriteRepository> {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByReceita: vi.fn(),
  };
}

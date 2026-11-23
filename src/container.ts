import { CategoryRepository } from "./repositories/CategoryRepository.js";
import { FavoriteRepository } from "./repositories/FavoriteRepository.js";
import { ReceitaRepository } from "./repositories/ReceitaRepository.js";
import { ReviewRepository } from "./repositories/ReviewRepository.js";
import { CategoryService } from "./services/CategoryService.js";
import { FavoriteService } from "./services/FavoriteService.js";
import { ReceitaService } from "./services/ReceitaService.js";
import { ReviewService } from "./services/ReviewService.js";

export interface Services {
  categories: CategoryService;
  receitas: ReceitaService;
  reviews: ReviewService;
  favorites: FavoriteService;
}

/** Monta os repositórios (Supabase) e injeta nos services. */
export function buildServices(): Services {
  const categoryRepository = new CategoryRepository();
  const receitaRepository = new ReceitaRepository();
  const reviewRepository = new ReviewRepository();
  const favoriteRepository = new FavoriteRepository();

  return {
    categories: new CategoryService(categoryRepository, receitaRepository),
    receitas: new ReceitaService(receitaRepository, categoryRepository),
    reviews: new ReviewService(reviewRepository, receitaRepository),
    favorites: new FavoriteService(favoriteRepository, receitaRepository),
  };
}

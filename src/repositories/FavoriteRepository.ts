import { getSupabase } from "../config/supabase.js";
import type { FavoriteData, FavoriteRecord } from "../models/Favorite.js";
import type { IFavoriteRepository } from "./interfaces.js";
import { throwDbError } from "./dbError.js";
import { SupabaseRepository } from "./SupabaseRepository.js";

export class FavoriteRepository
  extends SupabaseRepository<FavoriteRecord, FavoriteData>
  implements IFavoriteRepository
{
  constructor() {
    // Traz junto os dados da receita favoritada.
    super({ table: "favorites", select: "*, receitas(*)" });
  }

  async findByReceita(receitaId: string): Promise<FavoriteRecord | null> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select(this.selectClause)
      .eq("receita_id", receitaId)
      .maybeSingle();

    if (error) {
      throwDbError(error, "favorites.findByReceita");
    }

    return (data ?? null) as unknown as FavoriteRecord | null;
  }
}

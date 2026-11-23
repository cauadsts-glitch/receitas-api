import { getSupabase } from "../config/supabase.js";
import type { ReceitaData, ReceitaRecord } from "../models/Receita.js";
import type { IReceitaRepository } from "./interfaces.js";
import { escapeLike, throwDbError } from "./dbError.js";
import { SupabaseRepository } from "./SupabaseRepository.js";

export class ReceitaRepository
  extends SupabaseRepository<ReceitaRecord, ReceitaData>
  implements IReceitaRepository
{
  constructor() {
    super({
      table: "receitas",
      searchColumns: ["title", "description"],
    });
  }

  async findByTitleInCategory(
    categoryId: string,
    title: string,
  ): Promise<ReceitaRecord | null> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select("*")
      .eq("category_id", categoryId)
      .ilike("title", escapeLike(title))
      .limit(1)
      .maybeSingle();

    if (error) {
      throwDbError(error, "receitas.findByTitleInCategory");
    }

    return (data ?? null) as ReceitaRecord | null;
  }

  async countByCategory(
    categoryId: string,
    onlyActive = false,
  ): Promise<number> {
    let query = getSupabase()
      .from(this.table)
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId);

    if (onlyActive) {
      query = query.eq("active", true);
    }

    const { count, error } = await query;

    if (error) {
      throwDbError(error, "receitas.countByCategory");
    }

    return count ?? 0;
  }
}

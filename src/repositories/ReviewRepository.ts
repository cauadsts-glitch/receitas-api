import { getSupabase } from "../config/supabase.js";
import type { ReviewData, ReviewRecord } from "../models/Review.js";
import type { IReviewRepository } from "./interfaces.js";
import { throwDbError } from "./dbError.js";
import { SupabaseRepository } from "./SupabaseRepository.js";

export class ReviewRepository
  extends SupabaseRepository<ReviewRecord, ReviewData>
  implements IReviewRepository
{
  constructor() {
    super({
      table: "reviews",
      searchColumns: ["author_name", "comment"],
    });
  }

  async findByReceita(receitaId: string): Promise<ReviewRecord[]> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select("*")
      .eq("receita_id", receitaId)
      .order("created_at", { ascending: false });

    if (error) {
      throwDbError(error, "reviews.findByReceita");
    }

    return (data ?? []) as ReviewRecord[];
  }
}

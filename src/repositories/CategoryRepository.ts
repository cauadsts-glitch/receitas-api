import { getSupabase } from "../config/supabase.js";
import type { CategoryData, CategoryRecord } from "../models/Category.js";
import type { ICategoryRepository } from "./interfaces.js";
import { escapeLike, throwDbError } from "./dbError.js";
import { SupabaseRepository } from "./SupabaseRepository.js";

export class CategoryRepository
  extends SupabaseRepository<CategoryRecord, CategoryData>
  implements ICategoryRepository
{
  constructor() {
    super({
      table: "categories",
      orderBy: "display_order",
      ascending: true,
      searchColumns: ["name", "description"],
    });
  }

  async findByName(name: string): Promise<CategoryRecord | null> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select("*")
      .ilike("name", escapeLike(name))
      .limit(1)
      .maybeSingle();

    if (error) {
      throwDbError(error, "categories.findByName");
    }

    return (data ?? null) as CategoryRecord | null;
  }
}

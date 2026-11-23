import { getSupabase } from "../config/supabase.js";
import type { IRepository } from "./interfaces.js";
import { sanitizeKeyword, throwDbError } from "./dbError.js";

interface RepositoryOptions {
  table: string;
  /** Colunas retornadas (padrão: todas). */
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  /** Colunas usadas na pesquisa por palavra-chave. */
  searchColumns?: string[];
}

/**
 * Implementação genérica do CRUD sobre uma tabela do Supabase.
 * Cada repositório concreto herda esta classe e acrescenta consultas específicas.
 */
export abstract class SupabaseRepository<TRecord, TData extends object>
  implements IRepository<TRecord, TData>
{
  protected readonly table: string;
  protected readonly selectClause: string;
  protected readonly orderBy: string;
  protected readonly ascending: boolean;
  protected readonly searchColumns: string[];

  protected constructor(options: RepositoryOptions) {
    this.table = options.table;
    this.selectClause = options.select ?? "*";
    this.orderBy = options.orderBy ?? "created_at";
    this.ascending = options.ascending ?? false;
    this.searchColumns = options.searchColumns ?? [];
  }

  async findAll(): Promise<TRecord[]> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select(this.selectClause)
      .order(this.orderBy, { ascending: this.ascending });

    if (error) {
      throwDbError(error, `${this.table}.findAll`);
    }

    return (data ?? []) as unknown as TRecord[];
  }

  async findById(id: string): Promise<TRecord | null> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .select(this.selectClause)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwDbError(error, `${this.table}.findById`);
    }

    return (data ?? null) as unknown as TRecord | null;
  }

  async create(payload: TData): Promise<TRecord> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .insert(payload)
      .select(this.selectClause)
      .single();

    if (error) {
      throwDbError(error, `${this.table}.create`);
    }

    return data as unknown as TRecord;
  }

  async update(id: string, payload: Partial<TData>): Promise<TRecord | null> {
    const { data, error } = await getSupabase()
      .from(this.table)
           .update(payload as never)
      .eq("id", id)
      .select(this.selectClause)
      .maybeSingle();

    if (error) {
      throwDbError(error, `${this.table}.update`);
    }

    return (data ?? null) as unknown as TRecord | null;
  }

  async delete(id: string): Promise<boolean> {
    const { data, error } = await getSupabase()
      .from(this.table)
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throwDbError(error, `${this.table}.delete`);
    }

    return data !== null;
  }

  async search(keyword: string): Promise<TRecord[]> {
    const term = sanitizeKeyword(keyword);

    if (term === "" || this.searchColumns.length === 0) {
      return [];
    }

    const filter = this.searchColumns
      .map((column) => `${column}.ilike.%${term}%`)
      .join(",");

    const { data, error } = await getSupabase()
      .from(this.table)
      .select(this.selectClause)
      .or(filter)
      .order(this.orderBy, { ascending: this.ascending });

    if (error) {
      throwDbError(error, `${this.table}.search`);
    }

    return (data ?? []) as unknown as TRecord[];
  }
}

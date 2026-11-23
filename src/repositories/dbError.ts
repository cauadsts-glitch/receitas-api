import type { PostgrestError } from "@supabase/supabase-js";
import {
  ConflictError,
  DatabaseError,
  ValidationError,
} from "../errors/AppError.js";

/**
 * Converte um erro do Supabase/PostgreSQL em um erro da aplicação.
 * Os detalhes técnicos ficam apenas no log; o cliente recebe uma mensagem segura.
 */
export function throwDbError(error: PostgrestError, context: string): never {
  console.error(`[DB] ${context}:`, error);

  switch (error.code) {
    case "23505":
      throw new ConflictError("Já existe um registro com estes dados.");
    case "23503":
      throw new ConflictError(
        "A operação viola um relacionamento entre registros.",
      );
    case "22P02":
      throw new ValidationError("Algum valor informado está em formato inválido.");
    case "23514":
    case "23502":
      throw new ValidationError("Os dados violam uma restrição do banco.");
    default:
      throw new DatabaseError();
  }
}

/** Escapa os curingas do LIKE para comparar um texto literalmente. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Remove caracteres que quebrariam o filtro `or(...)` do PostgREST. */
export function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/[%,()*\\]/g, " ").trim();
}

import {
  asObject,
  optionalString,
  requiredUuid,
} from "../utils/validation.js";
import type { ReceitaRecord } from "./Receita.js";

/** Registro como está salvo na tabela `favorites` (com a receita associada). */
export interface FavoriteRecord {
  id: string;
  receita_id: string;
  note: string | null;
  created_at: string;
  receitas?: ReceitaRecord | null;
}

/** Dados graváveis de um favorito. */
export interface FavoriteData {
  receita_id: string;
  note: string | null;
}

export class Favorite {
  private readonly data: FavoriteData;

  private constructor(data: FavoriteData) {
    this.data = data;
  }

  static fromInput(body: unknown): Favorite {
    const input = asObject(body);

    return new Favorite({
      receita_id: requiredUuid(input, "receita_id", "O ID da receita"),
      note: optionalString(input, "note", "A anotação", 500),
    });
  }

  /** Na atualização de um favorito somente a anotação pode mudar. */
  static parseNoteUpdate(body: unknown): string | null {
    const input = asObject(body);

    return optionalString(input, "note", "A anotação", 500);
  }

  get receitaId(): string {
    return this.data.receita_id;
  }

  toPersistence(): FavoriteData {
    return { ...this.data };
  }
}

import {
  asObject,
  optionalBoolean,
  optionalNonNegativeInt,
  optionalString,
  requiredString,
} from "../utils/validation.js";

/** Registro como está salvo na tabela `categories`. */
export interface CategoryRecord {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  active: boolean;
  created_at: string;
}

/** Dados graváveis de uma categoria. */
export interface CategoryData {
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  active: boolean;
}

/**
 * Modelo de domínio de Categoria.
 * Garante (encapsulamento) que só existam instâncias com dados válidos.
 */
export class Category {
  private readonly data: CategoryData;

  private constructor(data: CategoryData) {
    this.data = data;
  }

  /** Cria uma categoria validando o corpo da requisição. */
  static fromInput(body: unknown): Category {
    const input = asObject(body);

    return new Category({
      name: requiredString(input, "name", "O nome da categoria", 100),
      description: optionalString(input, "description", "A descrição"),
      icon: optionalString(input, "icon", "O ícone", 100),
      display_order: optionalNonNegativeInt(
        input,
        "display_order",
        "A ordem de exibição",
        0,
      ),
      active: optionalBoolean(input, "active", "O campo active", true),
    });
  }

  /** Uma categoria só aceita novas receitas ativas enquanto estiver ativa. */
  static isAvailable(record: Pick<CategoryRecord, "active">): boolean {
    return record.active;
  }

  get name(): string {
    return this.data.name;
  }

  get active(): boolean {
    return this.data.active;
  }

  toPersistence(): CategoryData {
    return { ...this.data };
  }
}

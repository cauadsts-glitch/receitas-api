import {
  asObject,
  optionalBoolean,
  optionalPositiveInt,
  optionalString,
  requiredString,
  requiredUuid,
} from "../utils/validation.js";
import { ValidationError } from "../errors/AppError.js";

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

/** Registro como está salvo na tabela `receitas`. */
export interface ReceitaRecord {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  prep_time_minutes: number | null;
  servings: number | null;
  difficulty: Difficulty | null;
  image: string | null;
  active: boolean;
  created_at: string;
}

/** Dados graváveis de uma receita. */
export interface ReceitaData {
  category_id: string;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  prep_time_minutes: number | null;
  servings: number | null;
  difficulty: Difficulty | null;
  image: string | null;
  active: boolean;
}

export class Receita {
  private readonly data: ReceitaData;

  private constructor(data: ReceitaData) {
    this.data = data;
  }

  static fromInput(body: unknown): Receita {
    const input = asObject(body);

    return new Receita({
      category_id: requiredUuid(input, "category_id", "O ID da categoria"),
      title: requiredString(input, "title", "O título da receita"),
      description: optionalString(input, "description", "A descrição"),
      ingredients: requiredString(
        input,
        "ingredients",
        "O campo ingredientes",
        5000,
      ),
      instructions: requiredString(
        input,
        "instructions",
        "O modo de preparo",
        10000,
      ),
      prep_time_minutes: optionalPositiveInt(
        input,
        "prep_time_minutes",
        "O tempo de preparo",
      ),
      servings: optionalPositiveInt(input, "servings", "O número de porções"),
      difficulty: Receita.parseDifficulty(input["difficulty"]),
      image: optionalString(input, "image", "A imagem", 500),
      active: optionalBoolean(input, "active", "O campo active", true),
    });
  }

  private static parseDifficulty(value: unknown): Difficulty | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (
      typeof value !== "string" ||
      !(DIFFICULTIES as readonly string[]).includes(value)
    ) {
      throw new ValidationError(
        `A dificuldade deve ser uma destas opções: ${DIFFICULTIES.join(", ")}.`,
      );
    }

    return value as Difficulty;
  }

  /** Uma receita só pode receber avaliações e ser favoritada se estiver ativa. */
  static isAvailable(record: Pick<ReceitaRecord, "active">): boolean {
    return record.active;
  }

  get categoryId(): string {
    return this.data.category_id;
  }

  get title(): string {
    return this.data.title;
  }

  get active(): boolean {
    return this.data.active;
  }

  toPersistence(): ReceitaData {
    return { ...this.data };
  }
}

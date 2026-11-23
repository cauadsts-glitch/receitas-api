import {
  asObject,
  optionalString,
  requiredIntInRange,
  requiredString,
  requiredUuid,
} from "../utils/validation.js";

/** Registro como está salvo na tabela `reviews`. */
export interface ReviewRecord {
  id: string;
  receita_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** Dados graváveis de uma avaliação. */
export interface ReviewData {
  receita_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
}

export class Review {
  private readonly data: ReviewData;

  private constructor(data: ReviewData) {
    this.data = data;
  }

  static fromInput(body: unknown): Review {
    const input = asObject(body);

    return new Review({
      receita_id: requiredUuid(input, "receita_id", "O ID da receita"),
      author_name: requiredString(
        input,
        "author_name",
        "O nome do autor",
        100,
      ),
      rating: requiredIntInRange(input, "rating", "A nota", 1, 5),
      comment: optionalString(input, "comment", "O comentário"),
    });
  }

  get receitaId(): string {
    return this.data.receita_id;
  }

  get rating(): number {
    return this.data.rating;
  }

  toPersistence(): ReviewData {
    return { ...this.data };
  }
}

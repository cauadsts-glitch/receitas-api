/**
 * Erro base da aplicação. Carrega o código HTTP que deve ser devolvido ao cliente.
 */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
  }
}

/** 400 - dados de entrada inválidos. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/** 404 - recurso não encontrado. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

/** 409 - conflito com o estado atual (duplicidade, dependências existentes). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/** 422 - dados válidos, mas que violam uma regra de negócio. */
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}

/** 500 - falha ao acessar o banco de dados. */
export class DatabaseError extends AppError {
  constructor(message = "Erro ao acessar o banco de dados.") {
    super(message, 500);
  }
}

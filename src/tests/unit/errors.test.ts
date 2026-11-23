import { describe, expect, it } from "vitest";
import {
  AppError,
  BusinessRuleError,
  ConflictError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from "../../errors/AppError.js";

describe("errors", () => {
  it.each([
    [new ValidationError("x"), 400, "ValidationError"],
    [new NotFoundError("x"), 404, "NotFoundError"],
    [new ConflictError("x"), 409, "ConflictError"],
    [new BusinessRuleError("x"), 422, "BusinessRuleError"],
    [new DatabaseError(), 500, "DatabaseError"],
  ])("%#: mapeia o código HTTP correto", (error, status, name) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(status);
    expect(error.name).toBe(name);
  });

  it("usa 500 como código padrão do AppError", () => {
    expect(new AppError("falha").statusCode).toBe(500);
  });
});

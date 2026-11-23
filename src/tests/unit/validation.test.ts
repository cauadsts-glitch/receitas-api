import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors/AppError.js";
import {
  asObject,
  assertUuid,
  isUuid,
  optionalBoolean,
  optionalNonNegativeInt,
  optionalPositiveInt,
  optionalString,
  requiredIntInRange,
  requiredString,
  requiredUuid,
} from "../../utils/validation.js";
import { ID_1 } from "../helpers/fixtures.js";

describe("utils/validation", () => {
  describe("isUuid / assertUuid", () => {
    it("aceita um UUID válido", () => {
      expect(isUuid(ID_1)).toBe(true);
      expect(assertUuid(ID_1, "ID")).toBe(ID_1);
    });

    it("rejeita valores que não são UUID", () => {
      expect(isUuid("abc")).toBe(false);
      expect(isUuid(123)).toBe(false);
      expect(() => assertUuid("abc", "ID da receita")).toThrow(ValidationError);
    });
  });

  describe("asObject", () => {
    it("retorna o próprio objeto", () => {
      const body = { a: 1 };
      expect(asObject(body)).toBe(body);
    });

    it.each([[undefined], [null], ["texto"], [10], [[1, 2]]])(
      "rejeita %j como corpo da requisição",
      (value) => {
        expect(() => asObject(value)).toThrow(ValidationError);
      },
    );
  });

  describe("requiredString", () => {
    it("retorna o texto sem espaços nas pontas", () => {
      expect(requiredString({ n: "  Bolo  " }, "n", "O nome")).toBe("Bolo");
    });

    it("falha quando ausente, vazio ou com tipo errado", () => {
      expect(() => requiredString({}, "n", "O nome")).toThrow(
        "O nome é obrigatório.",
      );
      expect(() => requiredString({ n: "   " }, "n", "O nome")).toThrow(
        ValidationError,
      );
      expect(() => requiredString({ n: 5 }, "n", "O nome")).toThrow(
        ValidationError,
      );
    });

    it("falha quando passa do tamanho máximo", () => {
      expect(() =>
        requiredString({ n: "a".repeat(11) }, "n", "O nome", 10),
      ).toThrow("no máximo 10");
    });
  });

  describe("optionalString", () => {
    it("retorna null quando ausente, nulo ou vazio", () => {
      expect(optionalString({}, "d", "D")).toBeNull();
      expect(optionalString({ d: null }, "d", "D")).toBeNull();
      expect(optionalString({ d: "  " }, "d", "D")).toBeNull();
    });

    it("retorna o texto aparado", () => {
      expect(optionalString({ d: " oi " }, "d", "D")).toBe("oi");
    });

    it("falha com tipo errado ou texto muito longo", () => {
      expect(() => optionalString({ d: 1 }, "d", "D")).toThrow(ValidationError);
      expect(() => optionalString({ d: "abcdef" }, "d", "D", 3)).toThrow(
        ValidationError,
      );
    });
  });

  describe("optionalPositiveInt", () => {
    it("retorna null quando ausente", () => {
      expect(optionalPositiveInt({}, "n", "N")).toBeNull();
    });

    it("aceita inteiros positivos", () => {
      expect(optionalPositiveInt({ n: 4 }, "n", "N")).toBe(4);
    });

    it.each([0, -1, 1.5, "3"])("rejeita %j", (value) => {
      expect(() => optionalPositiveInt({ n: value }, "n", "N")).toThrow(
        ValidationError,
      );
    });
  });

  describe("optionalNonNegativeInt", () => {
    it("usa o valor padrão quando ausente", () => {
      expect(optionalNonNegativeInt({}, "n", "N", 7)).toBe(7);
    });

    it("aceita zero e positivos", () => {
      expect(optionalNonNegativeInt({ n: 0 }, "n", "N", 7)).toBe(0);
    });

    it.each([-1, 1.2, "2"])("rejeita %j", (value) => {
      expect(() => optionalNonNegativeInt({ n: value }, "n", "N", 0)).toThrow(
        ValidationError,
      );
    });
  });

  describe("requiredIntInRange", () => {
    it("aceita valores dentro do intervalo", () => {
      expect(requiredIntInRange({ r: 1 }, "r", "A nota", 1, 5)).toBe(1);
      expect(requiredIntInRange({ r: 5 }, "r", "A nota", 1, 5)).toBe(5);
    });

    it.each([0, 6, 2.5, "3", undefined])("rejeita %j", (value) => {
      expect(() => requiredIntInRange({ r: value }, "r", "A nota", 1, 5)).toThrow(
        "A nota deve ser um número inteiro de 1 a 5.",
      );
    });
  });

  describe("optionalBoolean", () => {
    it("usa o padrão quando ausente", () => {
      expect(optionalBoolean({}, "a", "A", true)).toBe(true);
      expect(optionalBoolean({ a: null }, "a", "A", false)).toBe(false);
    });

    it("respeita o valor informado", () => {
      expect(optionalBoolean({ a: false }, "a", "A", true)).toBe(false);
    });

    it("rejeita valores que não são booleanos", () => {
      expect(() => optionalBoolean({ a: "sim" }, "a", "A", true)).toThrow(
        ValidationError,
      );
    });
  });

  describe("requiredUuid", () => {
    it("aceita UUID válido", () => {
      expect(requiredUuid({ id: ID_1 }, "id", "O ID")).toBe(ID_1);
    });

    it("falha quando ausente ou inválido", () => {
      expect(() => requiredUuid({}, "id", "O ID")).toThrow("O ID é obrigatório.");
      expect(() => requiredUuid({ id: "x" }, "id", "O ID")).toThrow(
        ValidationError,
      );
    });
  });
});

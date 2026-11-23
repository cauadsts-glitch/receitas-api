import { describe, expect, it } from "vitest";
import { Category } from "../../models/Category.js";
import { Favorite } from "../../models/Favorite.js";
import { Receita } from "../../models/Receita.js";
import { Review } from "../../models/Review.js";
import {
  ID_1,
  ID_2,
  validCategoryBody,
  validReceitaBody,
  validReviewBody,
} from "../helpers/fixtures.js";

describe("models", () => {
  describe("Category", () => {
    it("cria uma categoria válida", () => {
      const category = Category.fromInput(validCategoryBody);

      expect(category.name).toBe("Sobremesas");
      expect(category.active).toBe(true);
      expect(category.toPersistence()).toEqual(validCategoryBody);
    });

    it("aplica valores padrão (display_order = 0 e active = true)", () => {
      const category = Category.fromInput({ name: "Massas" });

      expect(category.toPersistence()).toEqual({
        name: "Massas",
        description: null,
        icon: null,
        display_order: 0,
        active: true,
      });
    });

    it("rejeita categoria sem nome", () => {
      expect(() => Category.fromInput({})).toThrow(
        "O nome da categoria é obrigatório.",
      );
    });

    it("rejeita display_order negativo e active não booleano", () => {
      expect(() =>
        Category.fromInput({ name: "A", display_order: -1 }),
      ).toThrow();
      expect(() => Category.fromInput({ name: "A", active: "sim" })).toThrow();
    });

    it("informa se está disponível para novas receitas", () => {
      expect(Category.isAvailable({ active: true })).toBe(true);
      expect(Category.isAvailable({ active: false })).toBe(false);
    });

    it("não permite alterar o estado interno por fora", () => {
      const category = Category.fromInput(validCategoryBody);
      const copy = category.toPersistence();
      copy.name = "Alterado";

      expect(category.name).toBe("Sobremesas");
    });
  });

  describe("Receita", () => {
    it("cria uma receita válida", () => {
      const receita = Receita.fromInput(validReceitaBody);

      expect(receita.categoryId).toBe(ID_1);
      expect(receita.title).toBe("Bolo de cenoura");
      expect(receita.active).toBe(true);
      expect(receita.toPersistence().difficulty).toBe("easy");
    });

    it("aceita campos opcionais ausentes", () => {
      const receita = Receita.fromInput({
        category_id: ID_1,
        title: "Pão",
        ingredients: "farinha",
        instructions: "asse",
      });

      expect(receita.toPersistence()).toMatchObject({
        description: null,
        prep_time_minutes: null,
        servings: null,
        difficulty: null,
        image: null,
        active: true,
      });
    });

    it.each([
      [{ ...validReceitaBody, category_id: undefined }, "O ID da categoria é obrigatório."],
      [{ ...validReceitaBody, category_id: "abc" }, "UUID"],
      [{ ...validReceitaBody, title: "" }, "O título da receita é obrigatório."],
      [{ ...validReceitaBody, ingredients: undefined }, "O campo ingredientes é obrigatório."],
      [{ ...validReceitaBody, instructions: " " }, "O modo de preparo é obrigatório."],
      [{ ...validReceitaBody, difficulty: "impossible" }, "A dificuldade deve ser"],
      [{ ...validReceitaBody, difficulty: 3 }, "A dificuldade deve ser"],
      [{ ...validReceitaBody, servings: 0 }, "porções"],
      [{ ...validReceitaBody, prep_time_minutes: -5 }, "tempo de preparo"],
    ])("rejeita dados inválidos (%#)", (body, message) => {
      expect(() => Receita.fromInput(body)).toThrow(message);
    });

    it("só considera disponível a receita ativa", () => {
      expect(Receita.isAvailable({ active: true })).toBe(true);
      expect(Receita.isAvailable({ active: false })).toBe(false);
    });
  });

  describe("Review", () => {
    it("cria uma avaliação válida", () => {
      const review = Review.fromInput(validReviewBody);

      expect(review.receitaId).toBe(ID_2);
      expect(review.rating).toBe(5);
      expect(review.toPersistence()).toEqual(validReviewBody);
    });

    it.each([0, 6, 3.5, "5", undefined])("rejeita a nota %j", (rating) => {
      expect(() => Review.fromInput({ ...validReviewBody, rating })).toThrow(
        "A nota deve ser um número inteiro de 1 a 5.",
      );
    });

    it("rejeita avaliação sem autor ou sem receita", () => {
      expect(() =>
        Review.fromInput({ ...validReviewBody, author_name: "" }),
      ).toThrow("O nome do autor é obrigatório.");
      expect(() =>
        Review.fromInput({ ...validReviewBody, receita_id: undefined }),
      ).toThrow("O ID da receita é obrigatório.");
    });
  });

  describe("Favorite", () => {
    it("cria um favorito com anotação opcional", () => {
      expect(Favorite.fromInput({ receita_id: ID_2 }).toPersistence()).toEqual({
        receita_id: ID_2,
        note: null,
      });

      const favorite = Favorite.fromInput({ receita_id: ID_2, note: "Domingo" });
      expect(favorite.receitaId).toBe(ID_2);
      expect(favorite.toPersistence().note).toBe("Domingo");
    });

    it("rejeita favorito sem receita_id", () => {
      expect(() => Favorite.fromInput({ note: "x" })).toThrow(
        "O ID da receita é obrigatório.",
      );
    });

    it("lê somente a anotação na atualização", () => {
      expect(Favorite.parseNoteUpdate({ note: " Nova " })).toBe("Nova");
      expect(Favorite.parseNoteUpdate({})).toBeNull();
      expect(() => Favorite.parseNoteUpdate({ note: 123 })).toThrow();
    });
  });
});

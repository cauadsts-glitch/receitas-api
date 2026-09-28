import type { Request, Response } from "express";
import Review from "../models/Review.js";

function validateReview(body: any): string | null {
  if (!body?.receita_id || typeof body.receita_id !== "string") {
    return "O ID da receita é obrigatório.";
  }

  if (!body.author_name || typeof body.author_name !== "string") {
    return "O nome do autor é obrigatório.";
  }

  if (
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return "A nota deve ser um número inteiro de 1 a 5.";
  }

  return null;
}

async function getAll(req: Request, res: Response) {
  try {
    const reviews = await Review.findAll();

    res.status(200).json(reviews);
  } catch (error) {
    console.log("Erro ao buscar avaliações: ", error);

    res.status(404).json({
      message: "Erro ao buscar avaliações.",
    });
  }
}

async function getById(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID da Avaliação não informado.",
    });
  }

  try {
    const review = await Review.findById(id);

    res.status(200).json(review);
  } catch (error) {
    console.log("Erro ao buscar avaliação: ", error);

    res.status(404).json({
      message: "Erro ao buscar avaliação.",
    });
  }
}

async function getByReceita(
  req: Request<{ receitaId: string }>,
  res: Response,
) {
  const { receitaId } = req.params;

  if (!receitaId) {
    return res.status(400).json({
      message: "ID da Receita não informado.",
    });
  }

  try {
    const reviews = await Review.findByReceita(receitaId);

    res.status(200).json(reviews);
  } catch (error) {
    console.log("Erro ao buscar avaliações da receita: ", error);

    res.status(404).json({
      message: "Erro ao buscar avaliações.",
    });
  }
}

async function create(req: Request, res: Response) {
  const validationError = validateReview(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const review = await Review.create(req.body);

    res.status(201).json(review);
  } catch (error) {
    console.log("Erro ao criar avaliação: ", error);

    res.status(500).json({
      message: "Erro ao criar avaliação.",
    });
  }
}

async function update(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID da Avaliação não informado.",
    });
  }

  const validationError = validateReview(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const review = await Review.update(id, req.body);

    res.status(200).json(review);
  } catch (error) {
    console.log("Erro ao atualizar avaliação: ", error);

    res.status(404).json({
      message: "Avaliação não encontrada.",
    });
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID da Avaliação não informado.",
    });
  }

  try {
    const review = await Review.remove(id);

    res.status(200).json({
      message: "Avaliação removida com sucesso!",
    });
  } catch (error) {
    console.log("Erro ao remover avaliação: ", error);

    res.status(404).json({
      message: "Avaliação não encontrada.",
    });
  }
}

async function getByKeyword(req: Request<{ keyword: string }>, res: Response) {
  const { keyword } = req.params;

  if (!keyword || typeof keyword != "string") {
    return res.status(400).json({
      message: "Palavra-chave não informada.",
    });
  }

  try {
    const reviews = await Review.findByKeyword(keyword);

    res.status(200).json(reviews);
  } catch (error) {
    console.log("Erro ao pesquisar avaliações: ", error);

    res.status(404).json({
      message: "Erro ao buscar avaliações.",
    });
  }
}

export default {
  getAll,
  getById,
  getByReceita,
  create,
  update,
  remove,
  getByKeyword,
};

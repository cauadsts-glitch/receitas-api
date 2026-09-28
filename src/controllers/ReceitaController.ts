import type { Request, Response } from "express";
import Receita from "../models/Receita.js";

function validateReceita(body: any): string | null {
  if (!body?.category_id || typeof body.category_id !== "string") {
    return "O ID da categoria é obrigatório.";
  }

  if (!body.title || typeof body.title !== "string") {
    return "O título da receita é obrigatório.";
  }

  if (!body.ingredients || typeof body.ingredients !== "string") {
    return "Os ingredientes são obrigatórios.";
  }

  if (!body.instructions || typeof body.instructions !== "string") {
    return "O modo de preparo é obrigatório.";
  }

  return null;
}

async function getAll(req: Request, res: Response) {
  try {
    const receitas = await Receita.findAll();

    res.status(200).json(receitas);
  } catch (error) {
    console.log("Erro ao buscar receitas: ", error);

    res.status(404).json({
      message: "Erro ao buscar receitas.",
    });
  }
}

async function getById(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID da Receita não informado.",
    });
  }

  try {
    const receita = await Receita.findById(id);

    res.status(200).json(receita);
  } catch (error) {
    console.log("Erro ao buscar receita: ", error);

    res.status(404).json({
      message: "Erro ao buscar receita.",
    });
  }
}

async function create(req: Request, res: Response) {
  const validationError = validateReceita(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const receita = await Receita.create(req.body);

    res.status(201).json(receita);
  } catch (error) {
    console.log("Erro ao criar receita: ", error);

    res.status(500).json({
      message: "Erro ao criar receita.",
    });
  }
}

async function update(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID da Receita não informado.",
    });
  }

  const validationError = validateReceita(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const receita = await Receita.update(id, req.body);

    res.status(200).json(receita);
  } catch (error) {
    console.log("Erro ao atualizar receita: ", error);

    res.status(404).json({
      message: "Receita não encontrada.",
    });
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID da Receita não informado.",
    });
  }

  try {
    const receita = await Receita.remove(id);

    res.status(200).json({
      message: "Receita removida com sucesso!",
    });
  } catch (error) {
    console.log("Erro ao remover receita: ", error);

    res.status(404).json({
      message: "Receita não encontrada.",
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
    const receitas = await Receita.findByKeyword(keyword);

    res.status(200).json(receitas);
  } catch (error) {
    console.log("Erro ao pesquisar receitas: ", error);

    res.status(404).json({
      message: "Erro ao buscar receitas.",
    });
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  getByKeyword,
};

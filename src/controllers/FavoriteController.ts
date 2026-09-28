import type { Request, Response } from "express";
import Favorite from "../models/Favorite.js";

async function getAll(req: Request, res: Response) {
  try {
    const favorites = await Favorite.findAll();

    res.status(200).json(favorites);
  } catch (error) {
    console.log("Erro ao buscar favoritos: ", error);

    res.status(404).json({
      message: "Erro ao buscar favoritos.",
    });
  }
}

async function getById(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID do Favorito não informado.",
    });
  }

  try {
    const favorite = await Favorite.findById(id);

    res.status(200).json(favorite);
  } catch (error) {
    console.log("Erro ao buscar favorito: ", error);

    res.status(404).json({
      message: "Erro ao buscar favorito.",
    });
  }
}

async function create(req: Request, res: Response) {
  if (!req.body?.receita_id || typeof req.body.receita_id !== "string") {
    return res.status(400).json({
      message: "O ID da receita é obrigatório.",
    });
  }

  try {
    const favorite = await Favorite.create(req.body);

    res.status(201).json(favorite);
  } catch (error: any) {
    console.log("Erro ao criar favorito: ", error);

    // 23505 = violação de unicidade (receita já favoritada)
    if (error?.code === "23505") {
      return res.status(409).json({
        message: "Esta receita já está nos favoritos.",
      });
    }

    res.status(500).json({
      message: "Erro ao criar favorito.",
    });
  }
}

async function update(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID do Favorito não informado.",
    });
  }

  if (typeof req.body?.note !== "string") {
    return res.status(400).json({
      message: "A anotação (note) deve ser um texto.",
    });
  }

  try {
    const favorite = await Favorite.update(id, { note: req.body.note });

    res.status(200).json(favorite);
  } catch (error) {
    console.log("Erro ao atualizar favorito: ", error);

    res.status(404).json({
      message: "Favorito não encontrado.",
    });
  }
}

async function remove(req: Request<{ id: string }>, res: Response) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      message: "ID do Favorito não informado.",
    });
  }

  try {
    const favorite = await Favorite.remove(id);

    res.status(200).json({
      message: "Favorito removido com sucesso!",
    });
  } catch (error) {
    console.log("Erro ao remover favorito: ", error);

    res.status(404).json({
      message: "Favorito não encontrado.",
    });
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};

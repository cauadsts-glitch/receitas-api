import type { Request, Response } from "express";
import type { FavoriteService } from "../services/FavoriteService.js";

export class FavoriteController {
  constructor(private readonly service: FavoriteService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.getAll());
  };

  getById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    res.status(200).json(await this.service.getById(req.params.id));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.service.create(req.body));
  };

  update = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    res.status(200).json(await this.service.update(req.params.id, req.body));
  };

  remove = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    await this.service.remove(req.params.id);
    res.status(200).json({ message: "Favorito removido com sucesso!" });
  };
}

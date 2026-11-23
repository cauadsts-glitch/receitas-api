import type { Request, Response } from "express";
import type { ReviewService } from "../services/ReviewService.js";

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  getAll = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.service.getAll());
  };

  getByKeyword = async (
    req: Request<{ keyword: string }>,
    res: Response,
  ): Promise<void> => {
    res.status(200).json(await this.service.search(req.params.keyword));
  };

  getByReceita = async (
    req: Request<{ receitaId: string }>,
    res: Response,
  ): Promise<void> => {
    res.status(200).json(await this.service.getByReceita(req.params.receitaId));
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
    res.status(200).json({ message: "Avaliação removida com sucesso!" });
  };
}

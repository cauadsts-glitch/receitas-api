import { Router } from "express";
import type { ReviewController } from "../controllers/ReviewController.js";

export function reviewRouter(controller: ReviewController): Router {
  const router = Router();

  router.get("/", controller.getAll);
  router.get("/search/:keyword", controller.getByKeyword);
  router.get("/receita/:receitaId", controller.getByReceita);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

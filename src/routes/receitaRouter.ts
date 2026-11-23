import { Router } from "express";
import type { ReceitaController } from "../controllers/ReceitaController.js";

export function receitaRouter(controller: ReceitaController): Router {
  const router = Router();

  router.get("/", controller.getAll);
  router.get("/search/:keyword", controller.getByKeyword);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

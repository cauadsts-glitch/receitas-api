import { Router } from "express";
import type { FavoriteController } from "../controllers/FavoriteController.js";

export function favoriteRouter(controller: FavoriteController): Router {
  const router = Router();

  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

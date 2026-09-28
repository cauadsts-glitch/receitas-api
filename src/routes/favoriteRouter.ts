import { Router } from "express";
import FavoriteController from "../controllers/FavoriteController.js";

const router = Router();

router.get("/", FavoriteController.getAll);
router.get("/:id", FavoriteController.getById);
router.post("/", FavoriteController.create);
router.put("/:id", FavoriteController.update);
router.delete("/:id", FavoriteController.remove);

export default router;

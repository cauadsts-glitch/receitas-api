import { Router } from "express";
import ReviewController from "../controllers/ReviewController.js";

const router = Router();

router.get("/", ReviewController.getAll);
router.get("/search/:keyword", ReviewController.getByKeyword);
router.get("/receita/:receitaId", ReviewController.getByReceita);
router.get("/:id", ReviewController.getById);
router.post("/", ReviewController.create);
router.put("/:id", ReviewController.update);
router.delete("/:id", ReviewController.remove);

export default router;

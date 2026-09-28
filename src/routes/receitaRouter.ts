import { Router } from "express";
import ReceitaController from "../controllers/ReceitaController.js";

const router = Router();

router.get("/", ReceitaController.getAll);
router.get("/search/:keyword", ReceitaController.getByKeyword);
router.get("/:id", ReceitaController.getById);
router.post("/", ReceitaController.create);
router.put("/:id", ReceitaController.update);
router.delete("/:id", ReceitaController.remove);

export default router;

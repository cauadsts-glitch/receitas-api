import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";

import { buildServices, type Services } from "./container.js";
import { CategoryController } from "./controllers/CategoryController.js";
import { FavoriteController } from "./controllers/FavoriteController.js";
import { ReceitaController } from "./controllers/ReceitaController.js";
import { ReviewController } from "./controllers/ReviewController.js";
import { openApiDocument } from "./docs/swagger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { categoryRouter } from "./routes/categoryRouter.js";
import { favoriteRouter } from "./routes/favoriteRouter.js";
import { receitaRouter } from "./routes/receitaRouter.js";
import { reviewRouter } from "./routes/reviewRouter.js";

/**
 * Cria a aplicação Express. Os services podem ser injetados (útil em testes);
 * por padrão são montados com os repositórios reais do Supabase.
 */
export function createApp(services: Services = buildServices()): Express {
  const app = express();

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.status(200).json({
      message: "Receitas API",
      version: "1.0.0",
      docs: "/api-docs",
    });
  });

  // Documentação Swagger / OpenAPI
  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use("/categories", categoryRouter(new CategoryController(services.categories)));
  app.use("/receitas", receitaRouter(new ReceitaController(services.receitas)));
  app.use("/reviews", reviewRouter(new ReviewController(services.reviews)));
  app.use("/favorites", favoriteRouter(new FavoriteController(services.favorites)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

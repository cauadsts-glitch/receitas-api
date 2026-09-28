import express from "express";

import categoryRoutes from "./routes/categoryRouter.js";
import receitaRoutes from "./routes/receitaRouter.js";
import reviewRoutes from "./routes/reviewRouter.js";
import favoriteRoutes from "./routes/favoriteRouter.js";

const app = express();
app.use(express.json());

// ==========================
// Root
// ==========================
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Receitas API",
    version: "1.0.0",
  });
});

// ==========================
// Categories
// ==========================
app.use("/categories", categoryRoutes);

// ==========================
// Receitas
// ==========================
app.use("/receitas", receitaRoutes);

// ==========================
// Reviews
// ==========================
app.use("/reviews", reviewRoutes);

// ==========================
// Favorites
// ==========================
app.use("/favorites", favoriteRoutes);

export default app;

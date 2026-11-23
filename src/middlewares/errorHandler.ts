import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

/** Responde 404 para qualquer rota que não exista. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
  });
}

/** Tratamento global de erros: converte exceções em respostas HTTP coerentes. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  // JSON malformado enviado no corpo da requisição (erro do express.json()).
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { type?: string }).type === "entity.parse.failed"
  ) {
    res.status(400).json({ message: "JSON inválido no corpo da requisição." });
    return;
  }

  console.error("Erro inesperado:", err);

  res.status(500).json({ message: "Erro interno do servidor." });
}

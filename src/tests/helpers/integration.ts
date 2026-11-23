import type request from "supertest";

export type Api = ReturnType<typeof request>;

/** Garante que o banco de testes esteja configurado antes de rodar a integração. */
export function assertDatabaseEnv(): void {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "Testes de integração exigem SUPABASE_URL e SUPABASE_SECRET_KEY. " +
        "Configure o arquivo .env.test (ou .env) com o banco de TESTES.",
    );
  }
}

/** Gera um texto único para evitar colisão entre execuções dos testes. */
export function unique(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${random}`;
}

type Resource = "favorites" | "reviews" | "receitas" | "categories";

/**
 * Registra os registros criados durante os testes e os remove ao final,
 * respeitando as chaves estrangeiras (favoritos → avaliações → receitas → categorias).
 * Assim os testes podem ser executados várias vezes sem deixar lixo no banco.
 */
export class Cleanup {
  private readonly ids: Record<Resource, string[]> = {
    favorites: [],
    reviews: [],
    receitas: [],
    categories: [],
  };

  track(resource: Resource, id: string): void {
    this.ids[resource].push(id);
  }

  async run(api: Api): Promise<void> {
    const order: Resource[] = ["favorites", "reviews", "receitas", "categories"];

    for (const resource of order) {
      for (const id of this.ids[resource].reverse()) {
        // 404 é esperado quando o próprio teste já removeu o registro
        await api.delete(`/${resource}/${id}`);
      }
      this.ids[resource] = [];
    }
  }
}

export const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

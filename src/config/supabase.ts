import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Retorna o cliente do Supabase (criado sob demanda).
 * A criação é "preguiçosa" para que os testes unitários não precisem
 * de variáveis de ambiente nem de conexão com o banco.
 */
export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Variáveis de ambiente SUPABASE_URL e SUPABASE_SECRET_KEY não configuradas. Consulte o arquivo .env.example.",
    );
  }

  client = createClient(supabaseUrl, supabaseSecretKey);

  return client;
}

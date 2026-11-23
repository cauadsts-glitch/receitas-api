/**
 * Executado antes de todos os arquivos de teste.
 * Carrega as variáveis de ambiente do banco de TESTES:
 *   1) .env.test (prioridade)  2) .env
 * Variáveis já definidas no sistema (ex.: CI) nunca são sobrescritas.
 */
for (const file of [".env.test", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // arquivo inexistente: segue sem ele
  }
}

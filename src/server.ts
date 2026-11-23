import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, () => {
  console.log(`Servidor executando em http://localhost:${port}`);
  console.log(`Documentação Swagger em http://localhost:${port}/api-docs`);
});

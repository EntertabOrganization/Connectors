import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(env.PORT, () => {
  const baseUrl = `http://localhost:${env.PORT}`;

  logger.info("server.started", {
    port: env.PORT,
    baseUrl,
    swaggerUrl: `${baseUrl}/api/v1/docs`,
    openApiJsonUrl: `${baseUrl}/api/v1/docs.json`
  });

  console.log(`Connectors running at ${baseUrl}`);
  console.log(`Swagger UI: ${baseUrl}/api/v1/docs`);
  console.log(`OpenAPI JSON: ${baseUrl}/api/v1/docs.json`);
});

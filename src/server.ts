import { createApp } from "./app";
import { env } from "./config/env";
import { getQuickBooksConnectionDiagnostics } from "./services/quickbooks/quickbooks.auth.service";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(env.PORT, () => {
  const baseUrl = `http://localhost:${env.PORT}`;
  const quickbooksDiagnostics = getQuickBooksConnectionDiagnostics();

  logger.info("server.started", {
    port: env.PORT,
    baseUrl,
    swaggerUrl: `${baseUrl}/api/v1/docs`,
    openApiJsonUrl: `${baseUrl}/api/v1/docs.json`,
    quickbooksDiagnostics
  });

  console.log(`Connectors running at ${baseUrl}`);
  console.log(`Swagger UI: ${baseUrl}/api/v1/docs`);
  console.log(`OpenAPI JSON: ${baseUrl}/api/v1/docs.json`);
  console.log(
    `QuickBooks status: ${
      quickbooksDiagnostics.connected
        ? "connected"
        : quickbooksDiagnostics.configured
          ? "configured but OAuth approval still required"
          : "not configured"
    }`
  );
  if (!quickbooksDiagnostics.connected) {
    console.log(`QuickBooks connect URL: ${baseUrl}/api/v1/quickbooks/connect`);
  }
});

import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { handleCallback } from "./controllers/quickbooks.controller";
import healthRoutes from "./routes/health.routes";
import quickbooksRoutes from "./routes/quickbooks.routes";
import salesforceRoutes from "./routes/salesforce.routes";
import { swaggerDocument } from "./docs/swagger";

const swaggerNoCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0"
};

const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connectors API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f7f9fc;
      }

      #swagger-ui {
        min-height: 100vh;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/v1/docs.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    </script>
  </body>
</html>`;

export function createApp() {
  const app = express();

  app.get(
    ["/favicon.ico", "/favicon.png", "/favicon-16x16.png", "/favicon-32x32.png"],
    (_req, res) => {
      res.status(204).end();
    }
  );

  app.use(express.json());
  app.use(requestLogger);

  app.get("/", (_req, res) => {
    res.redirect("/api/v1/docs");
  });

  app.use(["/api/v1/docs", "/api/v1/docs.json"], (_req, res, next) => {
    res.set(swaggerNoCacheHeaders);
    next();
  });

  app.get("/api/v1/docs.json", (_req, res) => {
    res.json(swaggerDocument);
  });

  app.get("/api/v1/docs-health", (_req, res) => {
    res.json({
      docs: true,
      openapiJson: "/api/v1/docs.json"
    });
  });

  app.get(["/api/v1/docs", "/api/v1/docs/"], (_req, res) => {
    res.type("html").send(swaggerUiHtml);
  });

  app.get(
    [
      "/api/v1/docs/swagger-ui-bundle.js",
      "/api/v1/docs/swagger-ui-standalone-preset.js",
      "/api/v1/docs/swagger-ui-init.js",
      "/api/v1/docs/swagger-ui.css"
    ],
    (_req, res) => {
      res.status(404).json({
        error: "Swagger UI assets are served from CDN",
        openapiJson: "/api/v1/docs.json"
      });
    }
  );

  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/salesforce", salesforceRoutes);
  app.use("/api/v1/quickbooks", quickbooksRoutes);
  app.get("/api/quickbooks/auth/callback", handleCallback);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;

import express from "express";
import swaggerUi from "swagger-ui-express";
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

  app.use(
    "/api/v1/docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: "/api/v1/docs.json"
      }
    })
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

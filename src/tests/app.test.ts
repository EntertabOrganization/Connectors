import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/salesforce/salesforce.auth.service", () => ({
  getSalesforceAccessToken: vi.fn()
}));

import { createApp } from "../app";
import { getSalesforceAccessToken } from "../services/salesforce/salesforce.auth.service";

describe("app routes", () => {
  beforeEach(() => {
    vi.mocked(getSalesforceAccessToken).mockReset();
  });

  it("returns health information", async () => {
    const response = await request(createApp()).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.service).toBe("connectors");
  });

  it("returns integration status", async () => {
    vi.mocked(getSalesforceAccessToken).mockResolvedValue({
      accessToken: "token",
      instanceUrl: "https://example.salesforce.com"
    });

    const response = await request(createApp()).get("/api/v1/health/integrations");

    expect(response.status).toBe(200);
    expect(response.body.integrations.salesforce).toBeTypeOf("string");
  });

  it("returns 204 for root favicon requests", async () => {
    const app = createApp();

    for (const path of [
      "/favicon.ico",
      "/favicon.png",
      "/favicon-16x16.png",
      "/favicon-32x32.png"
    ]) {
      const response = await request(app).get(path);
      expect(response.status).toBe(204);
    }
  });

  it("serves Swagger from the explicit OpenAPI JSON URL without caching", async () => {
    const app = createApp();
    const noCache = "no-store, no-cache, must-revalidate, proxy-revalidate";

    const documentResponse = await request(app).get("/api/v1/docs.json");
    expect(documentResponse.status).toBe(200);
    expect(documentResponse.type).toBe("application/json");
    expect(documentResponse.body.openapi).toBe("3.0.0");
    expect(documentResponse.headers["cache-control"]).toBe(noCache);
    expect(documentResponse.headers.pragma).toBe("no-cache");
    expect(documentResponse.headers.expires).toBe("0");

    const initResponse = await request(app).get("/api/v1/docs/swagger-ui-init.js");
    expect(initResponse.status).toBe(200);
    expect(initResponse.text).toContain('"url": "/api/v1/docs.json"');
    expect(initResponse.text).not.toContain("localhost");
    expect(initResponse.headers["cache-control"]).toBe(noCache);

    for (const path of [
      "/api/v1/docs",
      "/api/v1/docs/?v=latest",
      "/api/v1/docs/swagger-ui-bundle.js",
      "/api/v1/docs/swagger-ui.css",
      "/api/v1/docs/swagger-ui-standalone-preset.js"
    ]) {
      const response = await request(app).get(path);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(400);
      expect(response.headers["cache-control"]).toBe(noCache);
      expect(response.headers.pragma).toBe("no-cache");
      expect(response.headers.expires).toBe("0");
    }
  });

  it("returns Swagger health information", async () => {
    const response = await request(createApp()).get("/api/v1/docs-health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      docs: true,
      openapiJson: "/api/v1/docs.json"
    });
  });

  it("exposes the QuickBooks auth callback route on /api/v1/quickbooks/auth/callback", async () => {
    const response = await request(createApp()).get("/api/v1/quickbooks/auth/callback");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(createApp()).get("/api/v1/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("validates salesforce lead payloads", async () => {
    const response = await request(createApp())
      .post("/api/v1/salesforce/leads/business")
      .send({ fullName: "", emailAddress: "bad" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

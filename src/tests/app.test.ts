import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/salesforce/salesforce.auth.service", () => ({
  getSalesforceAccessToken: vi.fn()
}));

vi.mock("../services/salesforce/salesforce.lead.service", () => ({
  createSalesforceLead: vi.fn(),
  findSalesforceLeadIdByEmailOrPhone: vi.fn(),
  getSalesforceLeadById: vi.fn(),
  getSalesforceLeads: vi.fn()
}));

import { createApp } from "../app";
import { getSalesforceAccessToken } from "../services/salesforce/salesforce.auth.service";
import { findSalesforceLeadIdByEmailOrPhone } from "../services/salesforce/salesforce.lead.service";
import { HttpError } from "../utils/http-error";

describe("app routes", () => {
  beforeEach(() => {
    vi.mocked(getSalesforceAccessToken).mockReset();
    vi.mocked(findSalesforceLeadIdByEmailOrPhone).mockReset();
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

    for (const path of ["/api/v1/docs", "/api/v1/docs/", "/api/v1/docs/?v=latest"]) {
      const response = await request(app).get(path);
      expect(response.status).toBe(200);
      expect(response.type).toBe("text/html");
      expect(response.text).toContain("https://unpkg.com/swagger-ui-dist/swagger-ui.css");
      expect(response.text).toContain("https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js");
      expect(response.text).toContain(
        "https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"
      );
      expect(response.text).toContain('url: "/api/v1/docs.json"');
      expect(response.text).not.toContain("localhost");
      expect(response.headers["cache-control"]).toBe(noCache);
      expect(response.headers.pragma).toBe("no-cache");
      expect(response.headers.expires).toBe("0");
    }

    for (const path of [
      "/api/v1/docs/swagger-ui-bundle.js",
      "/api/v1/docs/swagger-ui.css",
      "/api/v1/docs/swagger-ui-standalone-preset.js",
      "/api/v1/docs/swagger-ui-init.js"
    ]) {
      const response = await request(app).get(path);
      expect(response.status).toBe(404);
      expect(response.type).toBe("application/json");
      expect(response.body.error).toBe("Swagger UI assets are served from CDN");
      expect(response.body.openapiJson).toBe("/api/v1/docs.json");
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

  it("returns a Salesforce lead id when lookup by email or phone matches", async () => {
    vi.mocked(findSalesforceLeadIdByEmailOrPhone).mockResolvedValue({ id: "00Q-test" });

    const response = await request(createApp()).get(
      "/api/v1/salesforce/leads?email=karim@example.com&phone=%2B201001234567"
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: "00Q-test"
      }
    });
    expect(findSalesforceLeadIdByEmailOrPhone).toHaveBeenCalledWith({
      email: "karim@example.com",
      phone: "+201001234567"
    });
  });

  it("returns 404 when lookup by email or phone has no Salesforce match", async () => {
    vi.mocked(findSalesforceLeadIdByEmailOrPhone).mockRejectedValue(
      new HttpError(404, "Salesforce lead not found")
    );

    const response = await request(createApp()).get(
      "/api/v1/salesforce/leads?email=missing@example.com"
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe("Salesforce lead not found");
  });

  it("returns 400 when lead lookup omits email and phone", async () => {
    vi.mocked(findSalesforceLeadIdByEmailOrPhone).mockRejectedValue(
      new HttpError(400, "Email or phone is required")
    );

    const response = await request(createApp()).get("/api/v1/salesforce/leads");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe("Email or phone is required");
    expect(findSalesforceLeadIdByEmailOrPhone).toHaveBeenCalledWith({
      email: undefined,
      phone: undefined
    });
  });
});

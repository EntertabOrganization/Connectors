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

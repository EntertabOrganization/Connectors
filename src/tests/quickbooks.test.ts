import axios from "axios";
import { describe, expect, it, vi } from "vitest";
import {
  exchangeQuickBooksCode,
  getQuickBooksAuthUrl,
  refreshQuickBooksToken
} from "../services/quickbooks/quickbooks.auth.service";
import {
  normalizeQuickBooksCustomer,
  normalizeQuickBooksInvoice,
  normalizeQuickBooksItem
} from "../services/quickbooks/quickbooks.mapper";

vi.mock("axios");

describe("quickbooks services", () => {
  it("builds auth url", () => {
    const url = getQuickBooksAuthUrl();
    expect(url).toContain("oauth2");
    expect(url).toContain("response_type=code");
  });

  it("exchanges auth code", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: "token" }
    } as any);

    const result = await exchangeQuickBooksCode("abc");
    expect(result.access_token).toBe("token");
  });

  it("refreshes quickbooks token", async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { access_token: "new-token" }
    } as any);

    const result = await refreshQuickBooksToken("refresh");
    expect(result.access_token).toBe("new-token");
  });

  it("normalizes quickbooks responses", () => {
    expect(
      normalizeQuickBooksCustomer({
        Id: "1",
        DisplayName: "Ahmed Hassan",
        PrimaryEmailAddr: { Address: "ahmed@example.com" }
      }).displayName
    ).toBe("Ahmed Hassan");

    expect(
      normalizeQuickBooksInvoice({
        Id: "2",
        CustomerRef: { value: "1" },
        TotalAmt: 500
      }).totalAmount
    ).toBe(500);

    expect(
      normalizeQuickBooksItem({
        Id: "3",
        Name: "Travel Service",
        Type: "Service"
      }).name
    ).toBe("Travel Service");
  });
});

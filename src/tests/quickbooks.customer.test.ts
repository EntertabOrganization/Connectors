import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../utils/http-error";

const quickBooksClient = {
  get: vi.fn(),
  post: vi.fn()
};

vi.mock("../services/quickbooks/quickbooks.client", () => ({
  createQuickBooksClient: vi.fn(() => Promise.resolve(quickBooksClient))
}));

import { createQuickBooksCustomer } from "../services/quickbooks/quickbooks.customer.service";

describe("quickbooks customer creation", () => {
  beforeEach(() => {
    quickBooksClient.get.mockReset();
    quickBooksClient.post.mockReset();
  });

  it("returns an existing customer when primary email already exists", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: {
        QueryResponse: {
          Customer: [
            {
              Id: "58",
              DisplayName: "Ahmed Hassan",
              Active: true,
              PrimaryEmailAddr: { Address: "ahmed@example.com" }
            }
          ]
        }
      }
    });

    const result = await createQuickBooksCustomer({
      displayName: "Ahmed Hassan",
      primaryEmailAddr: "ahmed@example.com"
    });

    expect(result).toMatchObject({
      id: "58",
      displayName: "Ahmed Hassan",
      email: "ahmed@example.com"
    });
    expect(quickBooksClient.post).not.toHaveBeenCalled();
  });

  it("creates a customer when primary email is not found", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Customer: [] } }
    });
    quickBooksClient.post.mockResolvedValueOnce({
      data: {
        Customer: {
          Id: "59",
          DisplayName: "New Customer",
          PrimaryEmailAddr: { Address: "new@example.com" }
        }
      }
    });

    const result = await createQuickBooksCustomer({
      displayName: "New Customer",
      primaryEmailAddr: "new@example.com"
    });

    expect(quickBooksClient.post).toHaveBeenCalledWith("/customer", {
      DisplayName: "New Customer",
      GivenName: undefined,
      FamilyName: undefined,
      CompanyName: undefined,
      PrimaryEmailAddr: { Address: "new@example.com" },
      PrimaryPhone: undefined
    });
    expect(result.id).toBe("59");
  });

  it("preserves QuickBooks customer creation errors", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Customer: [] } }
    });
    quickBooksClient.post.mockRejectedValueOnce({
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        status: 400,
        data: {
          Fault: {
            Error: [
              {
                Message: "Duplicate Name Exists Error",
                Detail: "The name supplied already exists."
              }
            ]
          }
        }
      }
    });

    await expect(
      createQuickBooksCustomer({
        displayName: "Ahmed Hassan",
        primaryEmailAddr: "different@example.com"
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "QuickBooks request failed: The name supplied already exists."
    } satisfies Partial<HttpError>);
  });
});

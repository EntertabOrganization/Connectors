import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../utils/http-error";

const quickBooksClient = {
  get: vi.fn(),
  post: vi.fn()
};

vi.mock("../services/quickbooks/quickbooks.client", () => ({
  createQuickBooksClient: vi.fn(() => Promise.resolve(quickBooksClient))
}));

import { listQuickBooksItems } from "../services/quickbooks/quickbooks.item.service";

describe("quickbooks item listing", () => {
  beforeEach(() => {
    quickBooksClient.get.mockReset();
    quickBooksClient.post.mockReset();
  });

  it("lists QuickBooks items with the fixed 1000 item query", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: {
        QueryResponse: {
          Item: [
            {
              Id: "1",
              Name: "Travel",
              Description: "Travel coordination service",
              Type: "Service",
              Active: true,
              UnitPrice: 100,
              IncomeAccountRef: { value: "79" }
            }
          ]
        }
      }
    });

    const result = await listQuickBooksItems();

    expect(quickBooksClient.get).toHaveBeenCalledWith("/query", {
      params: {
        query: "SELECT * FROM Item STARTPOSITION 1 MAXRESULTS 1000"
      }
    });
    expect(result).toEqual([
      {
        id: "1",
        name: "Travel",
        description: "Travel coordination service",
        type: "Service",
        active: true,
        unitPrice: 100,
        incomeAccountRef: "79"
      }
    ]);
  });

  it("preserves QuickBooks item query errors", async () => {
    quickBooksClient.get.mockRejectedValueOnce({
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        status: 400,
        data: {
          Fault: {
            Error: [
              {
                Message: "Invalid query",
                Detail: "QueryValidationError: unexpected token"
              }
            ]
          }
        }
      }
    });

    await expect(listQuickBooksItems()).rejects.toMatchObject({
      statusCode: 400,
      message: "QuickBooks request failed: QueryValidationError: unexpected token"
    } satisfies Partial<HttpError>);
  });
});

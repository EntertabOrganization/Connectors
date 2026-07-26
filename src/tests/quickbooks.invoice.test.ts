import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "../utils/http-error";
import { quickBooksInvoiceSchema } from "../validators/quickbooks.validator";
import { getQuickBooksItemIdForProductService } from "../services/quickbooks/quickbooks.product-service-map";

const quickBooksClient = {
  get: vi.fn(),
  post: vi.fn()
};

vi.mock("../services/quickbooks/quickbooks.client", () => ({
  createQuickBooksClient: vi.fn(() => Promise.resolve(quickBooksClient))
}));

import {
  createQuickBooksInvoice,
  findQuickBooksCustomerByEmail
} from "../services/quickbooks/quickbooks.invoice.service";

describe("quickbooks invoice creation", () => {
  beforeEach(() => {
    quickBooksClient.get.mockReset();
    quickBooksClient.post.mockReset();
  });

  it("validates billing email and product service names", () => {
    const result = quickBooksInvoiceSchema.safeParse({
      billingEmail: "billing@example.com",
      lineItems: [
        {
          productServiceName: "Travel",
          quantity: 1,
          unitPrice: 1500
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid invoice fields", () => {
    const result = quickBooksInvoiceSchema.safeParse({
      customerId: "58",
      lineItems: [
        {
          itemId: "5",
          productServiceName: "Unknown Service",
          quantity: 1,
          unitPrice: 1500
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects legacy customerId and itemId fields", () => {
    const result = quickBooksInvoiceSchema.safeParse({
      billingEmail: "billing@example.com",
      customerId: "58",
      lineItems: [
        {
          productServiceName: "Travel",
          itemId: "5",
          quantity: 1,
          unitPrice: 1500
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("maps product service names to QuickBooks item ids", () => {
    expect(getQuickBooksItemIdForProductService("Travel")).toBe("5");
    expect(getQuickBooksItemIdForProductService("Professional Language Solutions")).toBe(
      "1010000071"
    );
  });

  it("finds a QuickBooks customer by billing email", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: {
        QueryResponse: {
          Customer: [
            {
              Id: "58",
              Active: true,
              PrimaryEmailAddr: { Address: "billing@example.com" }
            }
          ]
        }
      }
    });

    const result = await findQuickBooksCustomerByEmail("billing@example.com");

    expect(result).toEqual({
      id: "58",
      billingEmail: "billing@example.com"
    });
    expect(quickBooksClient.get).toHaveBeenCalledWith("/query", {
      params: {
        query:
          "SELECT * FROM Customer WHERE PrimaryEmailAddr = 'billing@example.com' STARTPOSITION 1 MAXRESULTS 10"
      }
    });
  });

  it("throws 404 when no QuickBooks customer matches billing email", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: { QueryResponse: { Customer: [] } }
    });

    await expect(findQuickBooksCustomerByEmail("missing@example.com")).rejects.toMatchObject({
      statusCode: 404
    } satisfies Partial<HttpError>);
  });

  it("preserves QuickBooks 400 errors instead of returning a generic 500", async () => {
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

    await expect(findQuickBooksCustomerByEmail("billing@example.com")).rejects.toMatchObject({
      statusCode: 400,
      message: "QuickBooks request failed: QueryValidationError: unexpected token"
    } satisfies Partial<HttpError>);
  });

  it("creates a QuickBooks invoice with resolved customer and mapped item ids", async () => {
    quickBooksClient.get.mockResolvedValueOnce({
      data: {
        QueryResponse: {
          Customer: [
            {
              Id: "58",
              Active: true,
              PrimaryEmailAddr: { Address: "billing@example.com" }
            }
          ]
        }
      }
    });
    quickBooksClient.post.mockResolvedValueOnce({
      data: {
        Invoice: {
          Id: "145",
          CustomerRef: { value: "58" },
          TotalAmt: 3000
        }
      }
    });

    const result = await createQuickBooksInvoice({
      billingEmail: "billing@example.com",
      dueDate: "2026-07-30",
      privateNote: "Net 15 invoice",
      lineItems: [
        {
          productServiceName: "Travel",
          description: "Travel coordination service",
          quantity: 2,
          unitPrice: 1500
        }
      ]
    });

    expect(quickBooksClient.post).toHaveBeenCalledWith("/invoice", {
      CustomerRef: { value: "58" },
      DueDate: "2026-07-30",
      PrivateNote: "Net 15 invoice",
      Line: [
        {
          DetailType: "SalesItemLineDetail",
          Amount: 3000,
          Description: "Travel coordination service",
          SalesItemLineDetail: {
            ItemRef: { value: "5" },
            Qty: 2,
            UnitPrice: 1500
          }
        }
      ]
    });
    expect(result.customerId).toBe("58");
  });
});

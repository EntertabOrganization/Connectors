import axios, { AxiosInstance } from "axios";
import { createQuickBooksClient } from "./quickbooks.client";
import { normalizeQuickBooksInvoice } from "./quickbooks.mapper";
import {
  getQuickBooksItemIdForProductService,
  QuickBooksProductServiceName
} from "./quickbooks.product-service-map";
import { HttpError } from "../../utils/http-error";

function escapeQuickBooksQueryValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function toQuickBooksHttpError(error: unknown) {
  if (error instanceof HttpError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return error;
  }

  const statusCode = error.response?.status ?? 500;
  const responseData = error.response?.data;
  const intuitError =
    responseData?.Fault?.Error?.[0]?.Detail ??
    responseData?.Fault?.Error?.[0]?.Message ??
    responseData?.Fault?.Error?.[0]?.code;
  const message = intuitError
    ? `QuickBooks request failed: ${intuitError}`
    : error.message;

  return new HttpError(statusCode, message, responseData);
}

export async function findQuickBooksCustomerByEmail(
  billingEmail: string,
  existingClient?: AxiosInstance
) {
  try {
    const client = existingClient ?? (await createQuickBooksClient());
    const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${escapeQuickBooksQueryValue(
      billingEmail
    )}' STARTPOSITION 1 MAXRESULTS 10`;
    const response = await client.get("/query", {
      params: { query }
    });
    const customers = response.data.QueryResponse?.Customer ?? [];
    const normalizedEmail = billingEmail.toLowerCase();
    const customer = customers.find((candidate: Record<string, any>) => {
      const email = candidate.PrimaryEmailAddr?.Address;
      return (
        candidate.Active !== false &&
        typeof email === "string" &&
        email.toLowerCase() === normalizedEmail
      );
    });

    if (!customer?.Id) {
      throw new HttpError(404, `QuickBooks customer not found for billing email ${billingEmail}`);
    }

    return {
      id: String(customer.Id),
      billingEmail: customer.PrimaryEmailAddr?.Address ?? billingEmail
    };
  } catch (error) {
    throw toQuickBooksHttpError(error);
  }
}

export async function createQuickBooksInvoice(payload: {
  billingEmail: string;
  lineItems: Array<{
    productServiceName: QuickBooksProductServiceName;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate?: string;
  privateNote?: string;
}) {
  try {
    const client = await createQuickBooksClient();
    const customer = await findQuickBooksCustomerByEmail(payload.billingEmail, client);
    const response = await client.post("/invoice", {
      CustomerRef: { value: customer.id },
      DueDate: payload.dueDate,
      PrivateNote: payload.privateNote,
      Line: payload.lineItems.map((item) => ({
        DetailType: "SalesItemLineDetail",
        Amount: item.quantity * item.unitPrice,
        Description: item.description,
        SalesItemLineDetail: {
          ItemRef: { value: getQuickBooksItemIdForProductService(item.productServiceName) },
          Qty: item.quantity,
          UnitPrice: item.unitPrice
        }
      }))
    });

    return normalizeQuickBooksInvoice(response.data.Invoice);
  } catch (error) {
    throw toQuickBooksHttpError(error);
  }
}

export async function listQuickBooksInvoices(params: {
  page?: number;
  limit?: number;
  customerId?: string;
}) {
  const client = await createQuickBooksClient();
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const startPosition = (page - 1) * limit + 1;
  const filter = params.customerId
    ? ` WHERE CustomerRef = '${params.customerId.replace(/'/g, "\\'")}'`
    : "";
  const query = `SELECT * FROM Invoice${filter} STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;
  const response = await client.get("/query", {
    params: { query }
  });

  const invoices = response.data.QueryResponse?.Invoice ?? [];
  return invoices.map(normalizeQuickBooksInvoice);
}

export async function getQuickBooksInvoiceById(id: string) {
  const client = await createQuickBooksClient();
  const response = await client.get(`/invoice/${id}`);
  return normalizeQuickBooksInvoice(response.data.Invoice);
}

import { createQuickBooksClient } from "./quickbooks.client";
import { normalizeQuickBooksInvoice } from "./quickbooks.mapper";

export async function createQuickBooksInvoice(payload: {
  customerId: string;
  lineItems: Array<{
    itemId: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate?: string;
  privateNote?: string;
}) {
  const client = await createQuickBooksClient();
  const response = await client.post("/invoice", {
    CustomerRef: { value: payload.customerId },
    DueDate: payload.dueDate,
    PrivateNote: payload.privateNote,
    Line: payload.lineItems.map((item) => ({
      DetailType: "SalesItemLineDetail",
      Amount: item.quantity * item.unitPrice,
      Description: item.description,
      SalesItemLineDetail: {
        ItemRef: { value: item.itemId },
        Qty: item.quantity,
        UnitPrice: item.unitPrice
      }
    }))
  });

  return normalizeQuickBooksInvoice(response.data.Invoice);
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

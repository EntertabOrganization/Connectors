import { createQuickBooksClient } from "./quickbooks.client";
import { normalizeQuickBooksItem } from "./quickbooks.mapper";

export async function createQuickBooksItem(payload: {
  name: string;
  description?: string;
  unitPrice?: number;
  incomeAccountRef?: string;
  type?: string;
}) {
  const client = await createQuickBooksClient();
  const response = await client.post("/item", {
    Name: payload.name,
    Description: payload.description,
    UnitPrice: payload.unitPrice,
    Type: payload.type ?? "Service",
    IncomeAccountRef: payload.incomeAccountRef
      ? { value: payload.incomeAccountRef }
      : undefined
  });

  return normalizeQuickBooksItem(response.data.Item);
}

export async function listQuickBooksItems(params: {
  page?: number;
  limit?: number;
}) {
  const client = await createQuickBooksClient();
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const startPosition = (page - 1) * limit + 1;
  const query = `SELECT * FROM Item STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;
  const response = await client.get("/query", {
    params: { query }
  });

  const items = response.data.QueryResponse?.Item ?? [];
  return items.map(normalizeQuickBooksItem);
}

export async function getQuickBooksItemById(id: string) {
  const client = await createQuickBooksClient();
  const response = await client.get(`/item/${id}`);
  return normalizeQuickBooksItem(response.data.Item);
}

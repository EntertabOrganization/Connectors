import { createQuickBooksClient } from "./quickbooks.client";
import { toQuickBooksHttpError } from "./quickbooks.error";
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

export async function listQuickBooksItems() {
  try {
    const client = await createQuickBooksClient();
    const query = "SELECT * FROM Item STARTPOSITION 1 MAXRESULTS 1000";
    const response = await client.get("/query", {
      params: { query }
    });

    const items = response.data.QueryResponse?.Item ?? [];
    return items.map(normalizeQuickBooksItem);
  } catch (error) {
    throw toQuickBooksHttpError(error);
  }
}

export async function getQuickBooksItemById(id: string) {
  const client = await createQuickBooksClient();
  const response = await client.get(`/item/${id}`);
  return normalizeQuickBooksItem(response.data.Item);
}

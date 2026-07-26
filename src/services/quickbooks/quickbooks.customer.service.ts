import { AxiosInstance } from "axios";
import { createQuickBooksClient } from "./quickbooks.client";
import { normalizeQuickBooksCustomer } from "./quickbooks.mapper";
import { escapeQuickBooksQueryValue, toQuickBooksHttpError } from "./quickbooks.error";

async function findExistingQuickBooksCustomerByEmail(
  primaryEmailAddr: string,
  existingClient?: AxiosInstance
) {
  const client = existingClient ?? (await createQuickBooksClient());
  const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${escapeQuickBooksQueryValue(
    primaryEmailAddr
  )}' STARTPOSITION 1 MAXRESULTS 10`;
  const response = await client.get("/query", {
    params: { query }
  });
  const customers = response.data.QueryResponse?.Customer ?? [];
  const normalizedEmail = primaryEmailAddr.toLowerCase();

  return customers.find((candidate: Record<string, any>) => {
    const email = candidate.PrimaryEmailAddr?.Address;
    return (
      candidate.Active !== false &&
      typeof email === "string" &&
      email.toLowerCase() === normalizedEmail
    );
  });
}

export async function createQuickBooksCustomer(payload: {
  displayName: string;
  givenName?: string;
  familyName?: string;
  primaryEmailAddr?: string;
  primaryPhone?: string;
  companyName?: string;
}) {
  try {
    const client = await createQuickBooksClient();

    if (payload.primaryEmailAddr) {
      const existingCustomer = await findExistingQuickBooksCustomerByEmail(
        payload.primaryEmailAddr,
        client
      );

      if (existingCustomer) {
        return normalizeQuickBooksCustomer(existingCustomer);
      }
    }

    const response = await client.post("/customer", {
      DisplayName: payload.displayName,
      GivenName: payload.givenName,
      FamilyName: payload.familyName,
      CompanyName: payload.companyName,
      PrimaryEmailAddr: payload.primaryEmailAddr
        ? { Address: payload.primaryEmailAddr }
        : undefined,
      PrimaryPhone: payload.primaryPhone
        ? { FreeFormNumber: payload.primaryPhone }
        : undefined
    });

    return normalizeQuickBooksCustomer(response.data.Customer);
  } catch (error) {
    throw toQuickBooksHttpError(error);
  }
}

export async function listQuickBooksCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const client = await createQuickBooksClient();
  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const startPosition = (page - 1) * limit + 1;
  const filter = params.search
    ? ` WHERE DisplayName LIKE '%${params.search.replace(/'/g, "\\'")}%'`
    : "";
  const query = `SELECT * FROM Customer${filter} STARTPOSITION ${startPosition} MAXRESULTS ${limit}`;
  const response = await client.get("/query", {
    params: { query }
  });

  const customers = response.data.QueryResponse?.Customer ?? [];
  return customers.map(normalizeQuickBooksCustomer);
}

export async function getQuickBooksCustomerById(id: string) {
  const client = await createQuickBooksClient();
  const response = await client.get(`/customer/${id}`);
  return normalizeQuickBooksCustomer(response.data.Customer);
}

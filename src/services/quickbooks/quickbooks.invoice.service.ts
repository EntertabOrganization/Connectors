import { AxiosInstance } from "axios";
import { createQuickBooksClient } from "./quickbooks.client";
import { normalizeQuickBooksInvoice } from "./quickbooks.mapper";
import {
  getQuickBooksItemIdForProductService,
  QuickBooksProductServiceName
} from "./quickbooks.product-service-map";
import { HttpError } from "../../utils/http-error";
import { escapeQuickBooksQueryValue, toQuickBooksHttpError } from "./quickbooks.error";

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

function isUsableInvoiceItem(item: Record<string, any> | undefined) {
  return Boolean(item?.Id && item.Active !== false && item.Type !== "Category");
}

async function findUsableQuickBooksItemByName(
  productServiceName: QuickBooksProductServiceName,
  client: AxiosInstance
) {
  const query = `SELECT * FROM Item WHERE Name = '${escapeQuickBooksQueryValue(
    productServiceName
  )}' STARTPOSITION 1 MAXRESULTS 100`;
  const response = await client.get("/query", {
    params: { query }
  });
  const items = response.data.QueryResponse?.Item ?? [];

  return items.find((item: Record<string, any>) => isUsableInvoiceItem(item));
}

async function resolveQuickBooksInvoiceItemId(
  productServiceName: QuickBooksProductServiceName,
  client: AxiosInstance
) {
  const mappedItemId = getQuickBooksItemIdForProductService(productServiceName);
  const mappedItemResponse = await client.get(`/item/${mappedItemId}`);
  const mappedItem = mappedItemResponse.data.Item;

  if (isUsableInvoiceItem(mappedItem)) {
    return String(mappedItem.Id);
  }

  const itemByName = await findUsableQuickBooksItemByName(productServiceName, client);

  if (itemByName?.Id) {
    return String(itemByName.Id);
  }

  const mappedType = mappedItem?.Type ? ` The mapped item type is ${mappedItem.Type}.` : "";
  throw new HttpError(
    400,
    `QuickBooks Product/Service "${productServiceName}" is not a sellable invoice item.${mappedType} Update the Product/Service mapping to an active non-category QuickBooks item.`
  );
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
    const resolvedLineItems = await Promise.all(
      payload.lineItems.map(async (item) => ({
        ...item,
        itemId: await resolveQuickBooksInvoiceItemId(item.productServiceName, client)
      }))
    );
    const response = await client.post("/invoice", {
      CustomerRef: { value: customer.id },
      DueDate: payload.dueDate,
      PrivateNote: payload.privateNote,
      Line: resolvedLineItems.map((item) => ({
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

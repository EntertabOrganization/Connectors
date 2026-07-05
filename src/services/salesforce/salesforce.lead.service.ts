import { createSalesforceClient } from "./salesforce.client";
import { mapLeadPayloadToSalesforceRecord, normalizeSalesforceLead } from "./salesforce.mapper";
import { buildNextCursor, LeadListQuery, parsePagination } from "../../utils/pagination.util";
import { HttpError } from "../../utils/http-error";

function escapeSoqlValue(value: string) {
  return value.replace(/'/g, "\\'");
}

export function buildLeadWhereClause(query: LeadListQuery): string {
  const conditions: string[] = [];

  if (query.cursor) {
    conditions.push(`CreatedDate < ${query.cursor}`);
  }
  if (query.serviceType) {
    conditions.push(`Service_Type__c = '${escapeSoqlValue(query.serviceType)}'`);
  }
  if (query.email) {
    conditions.push(`Email = '${escapeSoqlValue(query.email)}'`);
  }
  if (query.phone) {
    conditions.push(`Phone = '${escapeSoqlValue(query.phone)}'`);
  }
  if (query.search) {
    const term = `%${escapeSoqlValue(query.search)}%`;
    conditions.push(`(Name LIKE '${term}' OR Email LIKE '${term}' OR Phone LIKE '${term}')`);
  }
  if (query.fromDate) {
    conditions.push(`CreatedDate >= ${query.fromDate}`);
  }
  if (query.toDate) {
    conditions.push(`CreatedDate <= ${query.toDate}`);
  }

  return conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
}

export async function createSalesforceLead(serviceType: string, payload: Record<string, unknown>) {
  const client = await createSalesforceClient();
  const record = mapLeadPayloadToSalesforceRecord({ serviceType, payload });
  const response = await client.post("/sobjects/Lead", record);

  return {
    id: response.data.id,
    success: response.data.success
  };
}

export async function getSalesforceLeads(query: LeadListQuery) {
  const { page, limit, offset, cursor } = parsePagination(query);
  const client = await createSalesforceClient();
  const whereClause = buildLeadWhereClause(query);
  const offsetClause = cursor ? "" : ` OFFSET ${offset}`;

  const soql = [
    "SELECT Id, Name, FirstName, LastName, Email, Phone, Company, Status, LeadSource,",
    "Service_Type__c, CreatedDate, Description, Form_Data__c",
    "FROM Lead",
    whereClause,
    " ORDER BY CreatedDate DESC",
    ` LIMIT ${limit + 1}`,
    offsetClause
  ].join("");

  const response = await client.get("/query", {
    params: { q: soql }
  });

  const records = Array.isArray(response.data.records) ? response.data.records : [];
  const hasNextPage = records.length > limit;
  const visibleRecords = hasNextPage ? records.slice(0, limit) : records;
  const data = visibleRecords.map((record: Record<string, unknown>) => normalizeSalesforceLead(record));

  return {
    pagination: {
      page,
      limit,
      hasNextPage,
      nextCursor: hasNextPage
        ? buildNextCursor(String(visibleRecords[visibleRecords.length - 1]?.CreatedDate ?? ""))
        : null
    },
    data
  };
}

export async function getSalesforceLeadById(id: string) {
  const client = await createSalesforceClient();
  const soql =
    "SELECT Id, Name, FirstName, LastName, Email, Phone, Company, Status, LeadSource, " +
    "Service_Type__c, CreatedDate, Description, Form_Data__c FROM Lead " +
    `WHERE Id = '${escapeSoqlValue(id)}' LIMIT 1`;

  const response = await client.get("/query", { params: { q: soql } });
  const [record] = response.data.records ?? [];

  if (!record) {
    throw new HttpError(404, "Salesforce lead not found");
  }

  return normalizeSalesforceLead(record);
}

import axios from "axios";
import { createSalesforceClient } from "./salesforce.client";
import { mapLeadPayloadToSalesforceRecord, normalizeSalesforceLead } from "./salesforce.mapper";
import { buildNextCursor, LeadListQuery, parsePagination } from "../../utils/pagination.util";
import { HttpError } from "../../utils/http-error";

interface SalesforceFieldDescription {
  name: string;
  createable?: boolean;
  restrictedPicklist?: boolean;
  picklistValues?: Array<{
    value: string;
    active?: boolean;
  }>;
}

let cachedLeadFieldMap: Map<string, SalesforceFieldDescription> | null = null;

export function resetSalesforceLeadSchemaCache() {
  cachedLeadFieldMap = null;
}

async function getLeadFieldMap(client: Awaited<ReturnType<typeof createSalesforceClient>>) {
  if (cachedLeadFieldMap) {
    return cachedLeadFieldMap;
  }

  const response = await client.get("/sobjects/Lead/describe");
  const fields = Array.isArray(response.data?.fields) ? response.data.fields : [];

  cachedLeadFieldMap = new Map(
    fields
      .filter((field: SalesforceFieldDescription) => field.createable)
      .map((field: SalesforceFieldDescription) => [field.name, field] as const)
  );

  return cachedLeadFieldMap;
}

function findFirstAvailableField(
  candidates: string[],
  availableFields: Map<string, SalesforceFieldDescription>
) {
  return candidates.find((fieldName) => availableFields.has(fieldName));
}

function mapServiceTypeValue(
  serviceTypeValue: unknown,
  fieldName: string,
  availableFields: Map<string, SalesforceFieldDescription>
) {
  if (typeof serviceTypeValue !== "string") {
    return undefined;
  }

  const field = availableFields.get(fieldName);
  if (!field) {
    return undefined;
  }

  const mappedServiceTypes: Record<string, string> = {
    travel: "Travel Services",
    transportation: "Transportation Service"
  };

  const candidateValue = mappedServiceTypes[serviceTypeValue] ?? serviceTypeValue;
  if (!field.restrictedPicklist) {
    return candidateValue;
  }

  const allowedValues = new Set(
    (field.picklistValues ?? [])
      .filter((picklistValue) => picklistValue.active !== false)
      .map((picklistValue) => picklistValue.value)
  );

  return allowedValues.has(candidateValue) ? candidateValue : undefined;
}

function adaptLeadRecordToSchema(
  record: Record<string, unknown>,
  availableFields: Map<string, SalesforceFieldDescription>
) {
  const adaptableRecord = { ...record };
  const serviceTypeValue = adaptableRecord.Service_Type__c;
  delete adaptableRecord.Service_Type__c;

  const formDataValue = adaptableRecord.Form_Data__c;
  delete adaptableRecord.Form_Data__c;

  const serviceTypeField = findFirstAvailableField(
    ["Service_Type__c", "Service_of_Interest__c", "Trip_Service_Type__c"],
    availableFields
  );
  const formDataField = findFirstAvailableField(
    ["Form_Data__c", "Form_Data", "Payload__c", "Request_Payload__c"],
    availableFields
  );

  if (serviceTypeField && serviceTypeValue !== undefined) {
    const mappedServiceTypeValue = mapServiceTypeValue(
      serviceTypeValue,
      serviceTypeField,
      availableFields
    );
    if (mappedServiceTypeValue !== undefined) {
      adaptableRecord[serviceTypeField] = mappedServiceTypeValue;
    }
  }

  if (formDataField && formDataValue !== undefined) {
    adaptableRecord[formDataField] = formDataValue;
  }

  return Object.fromEntries(
    Object.entries(adaptableRecord).filter(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return false;
      }

      return availableFields.has(key);
    })
  );
}

function toSalesforceHttpError(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return error;
  }

  const statusCode = error.response?.status ?? 500;
  const responseData = error.response?.data;
  const salesforceErrors = Array.isArray(responseData) ? responseData : [];
  const message =
    salesforceErrors
      .map((item) => item?.message)
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join("; ") || error.message;

  return new HttpError(statusCode, message, responseData);
}

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
  try {
    const client = await createSalesforceClient();
    const record = mapLeadPayloadToSalesforceRecord({ serviceType, payload });
    const fieldMap = await getLeadFieldMap(client);
    const salesforceRecord = adaptLeadRecordToSchema(record, fieldMap);
    const response = await client.post("/sobjects/Lead", salesforceRecord);

    return {
      id: response.data.id,
      success: response.data.success
    };
  } catch (error) {
    throw toSalesforceHttpError(error);
  }
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

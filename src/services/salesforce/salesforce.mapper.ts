import { splitFullName } from "../../utils/name.util";

const leadSourceByServiceType: Record<string, string> = {
  business: "Website - Business Service",
  medical: "Website - Medical Service",
  events: "Website - Event Service",
  shipping: "Website - Shipping Service",
  transportation: "Website - Transportation Service",
  travel: "Website - Travel Service"
};

const descriptionByServiceType: Record<string, string> = {
  business: "Business service request from website",
  medical: "Medical service request from website",
  events: "Event service request from website",
  shipping: "Shipping service request from website",
  transportation: "Transportation service request from website",
  travel: "Travel service request from website"
};

export interface SalesforceLeadRecordInput {
  serviceType: string;
  payload: Record<string, unknown>;
}

export function normalizeShippingPayload(payload: Record<string, unknown>) {
  const normalized = { ...payload };

  if ("contactPerson" in normalized && !("shipperContactPerson" in normalized)) {
    normalized.shipperContactPerson = normalized.contactPerson;
    delete normalized.contactPerson;
  }

  if ("destinationCountry" in normalized && !("finalDestinationCountry" in normalized)) {
    normalized.finalDestinationCountry = normalized.destinationCountry;
    delete normalized.destinationCountry;
  }

  return normalized;
}

export function mapLeadPayloadToSalesforceRecord({
  serviceType,
  payload
}: SalesforceLeadRecordInput) {
  const finalPayload =
    serviceType === "shipping" ? normalizeShippingPayload(payload) : payload;

  const { firstName, lastName } = splitFullName(String(finalPayload.fullName ?? ""));

  return {
    FirstName: firstName,
    LastName: lastName || String(finalPayload.fullName ?? "Unknown"),
    Company:
      String(
        finalPayload.companyName ??
          finalPayload.organization ??
          finalPayload.shipperName ??
          "Individual"
      ) || "Individual",
    Email: String(finalPayload.emailAddress ?? ""),
    Phone: String(finalPayload.phoneNumber ?? ""),
    LeadSource: leadSourceByServiceType[serviceType] ?? "Website",
    Status: "New",
    Description: descriptionByServiceType[serviceType] ?? "Lead request from website",
    Service_Type__c: serviceType,
    Form_Data__c: JSON.stringify(finalPayload)
  };
}

export function normalizeSalesforceLead(record: Record<string, unknown>) {
  let formData: unknown;
  const rawFormData = record.Form_Data__c;

  if (typeof rawFormData === "string") {
    try {
      formData = JSON.parse(rawFormData);
    } catch {
      formData = rawFormData;
    }
  }

  return {
    id: record.Id,
    name: record.Name,
    firstName: record.FirstName,
    lastName: record.LastName,
    email: record.Email,
    phone: record.Phone,
    company: record.Company,
    status: record.Status,
    serviceType: record.Service_Type__c,
    leadSource: record.LeadSource,
    createdDate: record.CreatedDate,
    description: record.Description,
    formData
  };
}

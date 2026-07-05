import { describe, expect, it, vi } from "vitest";
import {
  buildLeadWhereClause,
  getSalesforceLeads
} from "../services/salesforce/salesforce.lead.service";
import {
  mapLeadPayloadToSalesforceRecord,
  normalizeShippingPayload
} from "../services/salesforce/salesforce.mapper";
import * as salesforceClient from "../services/salesforce/salesforce.client";

describe("salesforce mapping", () => {
  it("maps lead payload to salesforce record", () => {
    const record = mapLeadPayloadToSalesforceRecord({
      serviceType: "business",
      payload: {
        fullName: "Ahmed Hassan",
        phoneNumber: "+201001234567",
        emailAddress: "ahmed@example.com",
        companyName: "ABC Marketing"
      }
    });

    expect(record.LastName).toBe("Hassan");
    expect(record.Company).toBe("ABC Marketing");
    expect(record.Service_Type__c).toBe("business");
  });

  it("normalizes duplicate shipping keys", () => {
    const payload = normalizeShippingPayload({
      contactPerson: "Omar",
      destinationCountry: "Saudi Arabia"
    });

    expect(payload.shipperContactPerson).toBe("Omar");
    expect(payload.finalDestinationCountry).toBe("Saudi Arabia");
  });

  it("builds SOQL filters safely", () => {
    const clause = buildLeadWhereClause({
      search: "karim",
      serviceType: "travel",
      email: "karim@example.com"
    });

    expect(clause).toContain("Service_Type__c = 'travel'");
    expect(clause).toContain("Email = 'karim@example.com'");
    expect(clause).toContain("Name LIKE '%karim%'");
  });

  it("returns page based pagination and cursor metadata", async () => {
    const createClientSpy = vi
      .spyOn(salesforceClient, "createSalesforceClient")
      .mockResolvedValue({
        get: vi.fn().mockResolvedValue({
          data: {
            records: [
              { Id: "1", Name: "Lead One", CreatedDate: "2026-07-02T10:00:00.000Z" },
              { Id: "2", Name: "Lead Two", CreatedDate: "2026-07-01T10:00:00.000Z" }
            ]
          }
        })
      } as any);

    const result = await getSalesforceLeads({ limit: 1, page: 1 });

    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.nextCursor).toBe("2026-07-02T10:00:00.000Z");
    expect(result.data).toHaveLength(1);

    createClientSpy.mockRestore();
  });
});

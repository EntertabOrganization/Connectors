import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildLeadWhereClause,
  createSalesforceLead,
  getSalesforceLeads,
  resetSalesforceLeadSchemaCache
} from "../services/salesforce/salesforce.lead.service";
import {
  mapLeadPayloadToSalesforceRecord,
  normalizeShippingPayload
} from "../services/salesforce/salesforce.mapper";
import * as salesforceClient from "../services/salesforce/salesforce.client";
import { HttpError } from "../utils/http-error";

describe("salesforce mapping", () => {
  beforeEach(() => {
    resetSalesforceLeadSchemaCache();
    vi.restoreAllMocks();
  });

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

  it("adapts created lead payload to writable salesforce fields", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({
        data: {
          fields: [
            { name: "FirstName", createable: true },
            { name: "LastName", createable: true },
            { name: "Company", createable: true },
            { name: "Email", createable: true },
            { name: "Phone", createable: true },
            { name: "LeadSource", createable: true },
            { name: "Status", createable: true },
            {
              name: "Service_of_Interest__c",
              createable: true,
              restrictedPicklist: true,
              picklistValues: [
                { value: "Travel Services", active: true },
                { value: "Transportation Service", active: true }
              ]
            }
          ]
        }
      });
    const post = vi.fn().mockResolvedValue({
      data: { id: "00Q-test", success: true }
    });

    const createClientSpy = vi
      .spyOn(salesforceClient, "createSalesforceClient")
      .mockResolvedValue({ get, post } as any);

    const result = await createSalesforceLead("business", {
      fullName: "Ahmed Hassan",
      phoneNumber: "+201001234567",
      emailAddress: "ahmed@example.com",
      companyName: "ABC Marketing"
    });

    expect(result.success).toBe(true);
    expect(post).toHaveBeenCalledWith(
      "/sobjects/Lead",
      expect.objectContaining({
        FirstName: "Ahmed",
        LastName: "Hassan",
        Company: "ABC Marketing"
      })
    );
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty("Service_of_Interest__c");
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty("Service_Type__c");
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty("Form_Data__c");

    createClientSpy.mockRestore();
  });

  it("surfaces salesforce validation errors as http 400", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        fields: [
          { name: "FirstName", createable: true },
          { name: "LastName", createable: true },
          { name: "Company", createable: true }
        ]
      }
    });
    const post = vi.fn().mockRejectedValue({
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: {
        status: 400,
        data: [{ message: "Bad value for restricted picklist field: business" }]
      }
    });

    const createClientSpy = vi
      .spyOn(salesforceClient, "createSalesforceClient")
      .mockResolvedValue({ get, post } as any);

    await expect(
      createSalesforceLead("business", {
        fullName: "Ahmed Hassan",
        phoneNumber: "+201001234567",
        emailAddress: "ahmed@example.com",
        companyName: "ABC Marketing"
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Bad value for restricted picklist field: business"
    } satisfies Partial<HttpError>);

    createClientSpy.mockRestore();
  });

  it("maps supported travel service types to allowed restricted picklist values", async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        fields: [
          { name: "FirstName", createable: true },
          { name: "LastName", createable: true },
          { name: "Company", createable: true },
          {
            name: "Service_of_Interest__c",
            createable: true,
            restrictedPicklist: true,
            picklistValues: [{ value: "Travel Services", active: true }]
          }
        ]
      }
    });
    const post = vi.fn().mockResolvedValue({
      data: { id: "00Q-travel", success: true }
    });

    const createClientSpy = vi
      .spyOn(salesforceClient, "createSalesforceClient")
      .mockResolvedValue({ get, post } as any);

    await createSalesforceLead("travel", {
      fullName: "Laila Mostafa",
      phoneNumber: "+201022233344",
      emailAddress: "laila@example.com",
      companyName: "Entertab Travel"
    });

    expect(post).toHaveBeenCalledWith(
      "/sobjects/Lead",
      expect.objectContaining({
        Service_of_Interest__c: "Travel Services"
      })
    );

    createClientSpy.mockRestore();
  });
});

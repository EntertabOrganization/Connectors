export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Connectors API",
    version: "1.0.0",
    description: "Middleware API for Salesforce and QuickBooks integrations."
  },
  tags: [
    {
      name: "Health",
      description: "Health controller endpoints."
    },
    {
      name: "Sales Force",
      description: "Sales Force controller endpoints."
    },
    {
      name: "Quick Box",
      description: "Quick Box controller endpoints."
    }
  ],
  servers: [{ url: "/api/v1" }],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": { description: "Service is healthy" }
        }
      }
    },
    "/health/integrations": {
      get: {
        tags: ["Health"],
        summary: "Integration health",
        responses: {
          "200": { description: "Integration status returned" }
        }
      }
    },
    "/salesforce/leads/business": {
      post: {
        tags: ["Sales Force"],
        summary: "Create business lead",
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/medical": {
      post: {
        tags: ["Sales Force"],
        summary: "Create medical lead",
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/events": {
      post: {
        tags: ["Sales Force"],
        summary: "Create event lead",
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/shipping": {
      post: {
        tags: ["Sales Force"],
        summary: "Create shipping lead",
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/transportation": {
      post: {
        tags: ["Sales Force"],
        summary: "Create transportation lead",
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads/travel": {
      post: {
        tags: ["Sales Force"],
        summary: "Create travel lead",
        responses: { "201": { description: "Created" } }
      }
    },
    "/salesforce/leads": {
      get: {
        tags: ["Sales Force"],
        summary: "List Salesforce leads",
        responses: { "200": { description: "Lead list" } }
      }
    },
    "/salesforce/leads/{id}": {
      get: {
        tags: ["Sales Force"],
        summary: "Get Salesforce lead by ID",
        responses: { "200": { description: "Lead detail" } }
      }
    },
    "/quickbooks/auth-url": {
      get: {
        tags: ["Quick Box"],
        summary: "Generate QuickBooks auth URL",
        responses: { "200": { description: "Auth URL" } }
      }
    },
    "/quickbooks/callback": {
      get: {
        tags: ["Quick Box"],
        summary: "Handle QuickBooks OAuth callback",
        responses: { "200": { description: "Token payload" } }
      }
    },
    "/quickbooks/refresh-token": {
      post: {
        tags: ["Quick Box"],
        summary: "Refresh QuickBooks token",
        responses: { "200": { description: "Refreshed token" } }
      }
    },
    "/quickbooks/customers": {
      post: {
        tags: ["Quick Box"],
        summary: "Create QuickBooks customer",
        responses: { "201": { description: "Created" } }
      },
      get: {
        tags: ["Quick Box"],
        summary: "List QuickBooks customers",
        responses: { "200": { description: "Customer list" } }
      }
    },
    "/quickbooks/customers/{id}": {
      get: {
        tags: ["Quick Box"],
        summary: "Get QuickBooks customer by ID",
        responses: { "200": { description: "Customer detail" } }
      }
    },
    "/quickbooks/invoices": {
      post: {
        tags: ["Quick Box"],
        summary: "Create QuickBooks invoice",
        responses: { "201": { description: "Created" } }
      },
      get: {
        tags: ["Quick Box"],
        summary: "List QuickBooks invoices",
        responses: { "200": { description: "Invoice list" } }
      }
    },
    "/quickbooks/invoices/{id}": {
      get: {
        tags: ["Quick Box"],
        summary: "Get QuickBooks invoice by ID",
        responses: { "200": { description: "Invoice detail" } }
      }
    }
  }
};

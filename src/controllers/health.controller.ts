import { Request, Response } from "express";
import { isQuickBooksConfigured, quickbooksConfig } from "../config/quickbooks.config";
import { isSalesforceConfigured } from "../config/salesforce.config";
import { hydrateQuickBooksCredentials } from "../services/quickbooks/quickbooks.credentials";
import { getQuickBooksConnectionDiagnostics } from "../services/quickbooks/quickbooks.auth.service";
import { getSalesforceAccessToken } from "../services/salesforce/salesforce.auth.service";

export async function getHealth(_req: Request, res: Response) {
  res.json({
    status: "ok",
    service: "connectors",
    timestamp: new Date().toISOString()
  });
}

export async function getIntegrationHealth(_req: Request, res: Response) {
  await hydrateQuickBooksCredentials();

  let salesforce = "not_configured";
  if (isSalesforceConfigured()) {
    try {
      await getSalesforceAccessToken();
      salesforce = "connected";
    } catch {
      salesforce = "disconnected";
    }
  }

  const quickbooks =
    isQuickBooksConfigured() && quickbooksConfig.accessToken && quickbooksConfig.realmId
      ? "connected"
      : isQuickBooksConfigured()
        ? "configured"
        : "not_configured";

  res.json({
    status: "ok",
    integrations: {
      salesforce,
      quickbooks
    },
    quickbooksDiagnostics: getQuickBooksConnectionDiagnostics()
  });
}

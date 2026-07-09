import { Request, Response } from "express";
import { quickbooksConfig } from "../config/quickbooks.config";
import {
  ensureQuickBooksConnection,
  exchangeQuickBooksCode,
  getQuickBooksConnectionDiagnostics,
  getQuickBooksAuthUrl,
  refreshQuickBooksToken,
  storeQuickBooksTokens
} from "../services/quickbooks/quickbooks.auth.service";
import { hydrateQuickBooksCredentials } from "../services/quickbooks/quickbooks.credentials";
import {
  createQuickBooksCustomer,
  getQuickBooksCustomerById,
  listQuickBooksCustomers
} from "../services/quickbooks/quickbooks.customer.service";
import {
  createQuickBooksInvoice,
  getQuickBooksInvoiceById,
  listQuickBooksInvoices
} from "../services/quickbooks/quickbooks.invoice.service";
import { logger } from "../utils/logger";
import { successResponse } from "../utils/response.util";

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export async function getAuthUrl(_req: Request, res: Response) {
  const url = getQuickBooksAuthUrl();
  logger.info("quickbooks.auth_url.requested", {
    diagnostics: getQuickBooksConnectionDiagnostics()
  });
  res.json(successResponse({ url }));
}

export async function connectQuickBooks(_req: Request, res: Response) {
  const url = getQuickBooksAuthUrl();
  logger.info("quickbooks.connect.redirecting", {
    authUrl: url,
    diagnostics: getQuickBooksConnectionDiagnostics()
  });
  res.redirect(url);
}

export async function getConnectionStatus(_req: Request, res: Response) {
  await hydrateQuickBooksCredentials();

  const hasAccessToken = Boolean(quickbooksConfig.accessToken);
  const hasRefreshToken = Boolean(quickbooksConfig.refreshToken);
  const hasRealmId = Boolean(quickbooksConfig.realmId);

  res.json(
    successResponse({
      connected: hasRefreshToken && hasRealmId,
      environment: quickbooksConfig.environment,
      hasAccessToken,
      hasRefreshToken,
      hasRealmId,
      realmId: quickbooksConfig.realmId,
      companyName: quickbooksConfig.companyName,
      accessTokenExpiresAt: quickbooksConfig.accessTokenExpiresAt,
      refreshTokenExpiresAt: quickbooksConfig.refreshTokenExpiresAt,
      diagnostics: getQuickBooksConnectionDiagnostics(),
      nextAction:
        hasRefreshToken && hasRealmId
          ? "QuickBooks is connected."
          : "Open /api/v1/quickbooks/connect and complete the Intuit OAuth approval flow."
    })
  );
}

export async function handleCallback(req: Request, res: Response) {
  const code = req.query.code?.toString();
  const realmId = req.query.realmId?.toString();
  const state = req.query.state?.toString();

  logger.info("quickbooks.callback.received", {
    hasCode: Boolean(code),
    hasRealmId: Boolean(realmId),
    state
  });

  if (!code) {
    return res.status(400).json({
      success: false,
      error: { message: "Missing QuickBooks authorization code" }
    });
  }

  const tokenData = await exchangeQuickBooksCode(code);
  await storeQuickBooksTokens(tokenData, realmId);
  logger.info("quickbooks.callback.stored_credentials", {
    hasAccessToken: Boolean(tokenData.access_token),
    hasRefreshToken: Boolean(tokenData.refresh_token),
    realmId
  });
  const acceptsHtml = req.headers.accept?.includes("text/html");

  if (acceptsHtml) {
    return res.redirect("/api/v1/docs?quickbooks=connected");
  }

  res.json(
    successResponse({
      state,
      realmId,
      instructions:
        "QuickBooks credentials were stored in persistent storage. You can now call the customer and invoice endpoints directly."
    })
  );
}

export async function refreshToken(req: Request, res: Response) {
  logger.info("quickbooks.refresh_token.requested", {
    hasRefreshTokenInBody: Boolean(req.body?.refreshToken)
  });
  const tokenData = await refreshQuickBooksToken(req.body?.refreshToken);
  await storeQuickBooksTokens(tokenData);
  res.json(successResponse(tokenData));
}

export async function createCustomer(req: Request, res: Response) {
  const customer = await createQuickBooksCustomer(req.body);
  res.status(201).json(successResponse(customer));
}

export async function ensureConnection(_req: Request, res: Response) {
  logger.info("quickbooks.ensure_connection.requested", {
    diagnostics: getQuickBooksConnectionDiagnostics()
  });
  const connection = await ensureQuickBooksConnection();
  res.json(
    successResponse({
      connected: true,
      realmId: connection.realmId,
      companyName: quickbooksConfig.companyName
    })
  );
}

export async function listCustomers(req: Request, res: Response) {
  const customers = await listQuickBooksCustomers({
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    search: req.query.search?.toString()
  });
  res.json(successResponse(customers));
}

export async function getCustomerById(req: Request, res: Response) {
  const customer = await getQuickBooksCustomerById(getRouteParam(req.params.id));
  res.json(successResponse(customer));
}

export async function createInvoice(req: Request, res: Response) {
  const invoice = await createQuickBooksInvoice(req.body);
  res.status(201).json(successResponse(invoice));
}

export async function listInvoices(req: Request, res: Response) {
  const invoices = await listQuickBooksInvoices({
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    customerId: req.query.customerId?.toString()
  });
  res.json(successResponse(invoices));
}

export async function getInvoiceById(req: Request, res: Response) {
  const invoice = await getQuickBooksInvoiceById(getRouteParam(req.params.id));
  res.json(successResponse(invoice));
}

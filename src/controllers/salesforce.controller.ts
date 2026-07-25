import { Request, Response } from "express";
import {
  createSalesforceLead,
  findSalesforceLeadIdByEmailOrPhone,
  getSalesforceLeadById
} from "../services/salesforce/salesforce.lead.service";
import { successResponse } from "../utils/response.util";

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
}

function getQueryParam(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return getQueryParam(value[0]);
  }
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : undefined;
}

async function handleCreateLead(serviceType: string, req: Request, res: Response) {
  const result = await createSalesforceLead(serviceType, req.body);
  res.status(201).json(
    successResponse({
      id: result.id,
      serviceType,
      created: result.success
    })
  );
}

export async function createBusinessLead(req: Request, res: Response) {
  return handleCreateLead("business", req, res);
}

export async function createMedicalLead(req: Request, res: Response) {
  return handleCreateLead("medical", req, res);
}

export async function createEventLead(req: Request, res: Response) {
  return handleCreateLead("events", req, res);
}

export async function createShippingLead(req: Request, res: Response) {
  return handleCreateLead("shipping", req, res);
}

export async function createTransportationLead(req: Request, res: Response) {
  return handleCreateLead("transportation", req, res);
}

export async function createTravelLead(req: Request, res: Response) {
  return handleCreateLead("travel", req, res);
}

export async function listLeads(req: Request, res: Response) {
  const email = getQueryParam(req.query.email);
  const phone = getQueryParam(req.query.phone);

  const result = await findSalesforceLeadIdByEmailOrPhone({ email, phone });
  return res.json(successResponse(result));
}

export async function getLeadById(req: Request, res: Response) {
  const lead = await getSalesforceLeadById(getRouteParam(req.params.id));
  res.json(successResponse(lead));
}

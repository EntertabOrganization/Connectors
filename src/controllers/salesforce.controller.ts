import { Request, Response } from "express";
import {
  createSalesforceLead,
  getSalesforceLeadById,
  getSalesforceLeads
} from "../services/salesforce/salesforce.lead.service";
import { successResponse } from "../utils/response.util";

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : value ?? "";
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
  const result = await getSalesforceLeads({
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    cursor: req.query.cursor?.toString(),
    search: req.query.search?.toString(),
    serviceType: req.query.serviceType?.toString(),
    email: req.query.email?.toString(),
    phone: req.query.phone?.toString(),
    fromDate: req.query.fromDate?.toString(),
    toDate: req.query.toDate?.toString()
  });

  res.json({
    success: true,
    pagination: result.pagination,
    data: result.data
  });
}

export async function getLeadById(req: Request, res: Response) {
  const lead = await getSalesforceLeadById(getRouteParam(req.params.id));
  res.json(successResponse(lead));
}

import { Router } from "express";
import {
  createBusinessLead,
  createEventLead,
  createMedicalLead,
  createShippingLead,
  createTransportationLead,
  createTravelLead,
  getLeadById,
  listLeads
} from "../controllers/salesforce.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { businessLeadSchema } from "../validators/businessLead.validator";
import { eventLeadSchema } from "../validators/eventLead.validator";
import { medicalLeadSchema } from "../validators/medicalLead.validator";
import { shippingLeadSchema } from "../validators/shippingLead.validator";
import { transportationLeadSchema } from "../validators/transportationLead.validator";
import { travelLeadSchema } from "../validators/travelLead.validator";

const router = Router();

router.post("/leads/business", validateRequest(businessLeadSchema), createBusinessLead);
router.post("/leads/medical", validateRequest(medicalLeadSchema), createMedicalLead);
router.post("/leads/events", validateRequest(eventLeadSchema), createEventLead);
router.post("/leads/shipping", validateRequest(shippingLeadSchema), createShippingLead);
router.post(
  "/leads/transportation",
  validateRequest(transportationLeadSchema),
  createTransportationLead
);
router.post("/leads/travel", validateRequest(travelLeadSchema), createTravelLead);
router.get("/leads", listLeads);
router.get("/leads/:id", getLeadById);

export default router;

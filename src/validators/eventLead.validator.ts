import { z } from "zod";
import { commonLeadSchema } from "./commonLead.validator";

export const eventLeadSchema = commonLeadSchema.extend({
  organization: z.string().optional(),
  position: z.string().optional(),
  eventName: z.string().optional(),
  eventType: z.string().optional(),
  theme: z.string().optional(),
  preferredDate: z.string().optional(),
  duration: z.string().optional(),
  expectedAttendees: z.union([z.string(), z.number()]).optional(),
  targetAudience: z.string().optional(),
  preferredVenue: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  indoorOutdoor: z.string().optional(),
  venueSuggestionsNeeded: z.boolean().optional(),
  bookingSupportNeeded: z.boolean().optional(),
  coreServices: z.array(z.string()).optional(),
  additionalServices: z.array(z.string()).optional(),
  additionalServicesOther: z.string().optional(),
  estimatedBudget: z.number().optional(),
  additionalNotes: z.string().optional()
});

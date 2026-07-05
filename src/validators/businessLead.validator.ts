import { z } from "zod";
import { commonLeadSchema } from "./commonLead.validator";

export const businessLeadSchema = commonLeadSchema.extend({
  dateOfBirth: z.string().optional(),
  passportNumber: z.string().optional(),
  gender: z.string().optional(),
  countryOfDeparture: z.string().optional(),
  destinationCountryCity: z.string().optional(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  companyIndustry: z.string().optional(),
  preferredDepartureDate: z.string().optional(),
  preferredReturnDate: z.string().optional(),
  travelAlone: z.boolean().optional(),
  specialInstructions: z.string().optional(),
  requiredSupportServices: z.array(z.string()).optional(),
  additionalNotes: z.string().optional()
});

export type BusinessLeadInput = z.infer<typeof businessLeadSchema>;

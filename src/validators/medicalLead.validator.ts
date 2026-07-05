import { z } from "zod";
import { commonLeadSchema } from "./commonLead.validator";

export const medicalLeadSchema = commonLeadSchema.extend({
  dateOfBirth: z.string().optional(),
  passportNumber: z.string().optional(),
  gender: z.string().optional(),
  countryOfResidence: z.string().optional(),
  destinationCountry: z.string().optional(),
  preferredDeparture: z.string().optional(),
  preferredReturn: z.string().optional(),
  travelAlone: z.boolean().optional(),
  whoAccompanies: z.string().optional(),
  bookingFlights: z.string().optional(),
  accommodation: z.string().optional(),
  transportation: z.string().optional(),
  interpreter: z.string().optional(),
  medicalArrangements: z.string().optional(),
  hospitalAssistance: z.string().optional(),
  specifyMedical: z.string().optional(),
  preferredClinic: z.string().optional(),
  additionalNotes: z.string().optional()
});

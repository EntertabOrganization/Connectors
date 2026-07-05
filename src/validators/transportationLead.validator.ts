import { z } from "zod";
import { commonLeadSchema } from "./commonLead.validator";

export const transportationLeadSchema = commonLeadSchema.extend({
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  tripType: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  numberOfPassengers: z.union([z.string(), z.number()]).optional(),
  childSeat: z.string().optional(),
  luggage: z.string().optional(),
  vehicleType: z.string().optional(),
  specialRequests: z.string().optional()
});

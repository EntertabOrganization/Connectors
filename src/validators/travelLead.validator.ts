import { z } from "zod";
import { commonLeadSchema } from "./commonLead.validator";

export const travelLeadSchema = commonLeadSchema.extend({
  tripType: z.string().optional(),
  flightClass: z.string().optional(),
  leavingFrom: z.string().optional(),
  goingTo: z.string().optional(),
  departingDate: z.string().optional(),
  returnDate: z.string().optional(),
  airline: z.string().optional(),
  stops: z.number().optional(),
  destination: z.string().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  infants: z.number().optional(),
  hotelName: z.string().optional(),
  roomType: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  nightsCount: z.number().optional(),
  mealPreference: z.string().optional(),
  pickupLocation: z.string().optional(),
  dropoffLocation: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  rentalPickupDate: z.string().optional(),
  rentalDropoffDate: z.string().optional(),
  carType: z.string().optional(),
  driverAge: z.number().optional(),
  specialRequests: z.string().optional()
});

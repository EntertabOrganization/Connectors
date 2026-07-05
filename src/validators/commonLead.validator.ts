import { z } from "zod";

export const commonLeadSchema = z.object({
  fullName: z.string().min(1),
  phoneNumber: z.string().min(3),
  emailAddress: z.email()
});

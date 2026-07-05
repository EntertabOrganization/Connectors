import { z } from "zod";

export const refreshQuickBooksTokenSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

export const quickBooksCustomerSchema = z.object({
  displayName: z.string().min(1),
  givenName: z.string().optional(),
  familyName: z.string().optional(),
  primaryEmailAddr: z.email().optional(),
  primaryPhone: z.string().optional(),
  companyName: z.string().optional()
});

export const quickBooksInvoiceSchema = z.object({
  customerId: z.string().min(1),
  lineItems: z
    .array(
      z.object({
        itemId: z.string().min(1),
        description: z.string().optional(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative()
      })
    )
    .min(1),
  dueDate: z.string().optional(),
  privateNote: z.string().optional()
});

export const quickBooksItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.number().nonnegative().optional(),
  incomeAccountRef: z.string().optional(),
  type: z.string().optional()
});

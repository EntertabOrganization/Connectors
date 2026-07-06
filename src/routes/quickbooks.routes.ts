import { Router } from "express";
import {
  connectQuickBooks,
  createCustomer,
  createInvoice,
  ensureConnection,
  getAuthUrl,
  getConnectionStatus,
  getCustomerById,
  getInvoiceById,
  handleCallback,
  listCustomers,
  listInvoices,
  refreshToken
} from "../controllers/quickbooks.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import {
  quickBooksCustomerSchema,
  quickBooksInvoiceSchema,
  refreshQuickBooksTokenSchema
} from "../validators/quickbooks.validator";

const router = Router();

router.get("/connect", connectQuickBooks);
router.get("/status", getConnectionStatus);
router.get("/auth-url", getAuthUrl);
router.get("/callback", handleCallback);
router.post("/connect", ensureConnection);
router.post("/refresh-token", validateRequest(refreshQuickBooksTokenSchema), refreshToken);
router.post("/customers", validateRequest(quickBooksCustomerSchema), createCustomer);
router.get("/customers", listCustomers);
router.get("/customers/:id", getCustomerById);
router.post("/invoices", validateRequest(quickBooksInvoiceSchema), createInvoice);
router.get("/invoices", listInvoices);
router.get("/invoices/:id", getInvoiceById);

export default router;

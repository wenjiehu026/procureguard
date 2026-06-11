import { z } from "zod";

export const procurementRequestSchema = z.object({
  employeeName: z.string().min(2).max(80),
  employeeEmail: z.string().email(),
  department: z.string().min(2).max(80),
  category: z.enum(["laptop", "monitor", "security-key", "mobile-device", "accessory"]),
  quantity: z.coerce.number().int().min(1).max(20),
  maxBudget: z.coerce.number().min(50).max(50000),
  currency: z.literal("USD").default("USD"),
  region: z.enum(["US", "EU", "APAC"]),
  urgency: z.enum(["standard", "expedite"]),
  businessPurpose: z.string().min(12).max(800),
});

export const approvalSchema = z.object({
  approved: z.boolean(),
  approvalId: z.string().min(4).max(80).optional(),
});

export const procurementSearchSchema = z.object({
  category: z.enum(["laptop", "monitor", "security-key", "mobile-device", "accessory"]),
  quantity: z.coerce.number().int().min(1).max(20),
  maxBudget: z.coerce.number().min(50).max(50000),
  region: z.enum(["US", "EU", "APAC"]),
});

export const purchaseRequestSchema = z.object({
  quoteId: z.string().min(3),
  amount: z.coerce.number().positive(),
  currency: z.literal("USD"),
  justification: z.string().min(8).max(800),
  approvalId: z.string().min(4).max(80),
});

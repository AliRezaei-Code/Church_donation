import { z } from "zod";

export const donationSchema = z.object({
  amountCents: z.number().int().positive(),
  fund: z.enum(["General", "Missions"]),
  email: z.string().email(),
  recurring: z.boolean(),
});

export const adminSummarySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  fund: z.enum(["General", "Missions"]).optional(),
});

export type DonationInput = z.infer<typeof donationSchema>;

import { z } from "zod";

export const ZActivateUserSchema = z.object({
  userId: z.number(),
});

export type TActivateUserSchema = z.infer<typeof ZActivateUserSchema>;

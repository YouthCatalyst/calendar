import type { NextApiRequest, NextApiResponse } from "next/types";
import { z } from "zod";

import prisma from "@calcom/prisma";

export const getEventTypeQuerySchema = z.object({
  userEmail: z.string().optional(),
  page: z
    .preprocess((val) => Number(val), z.number().int().positive())
    .optional()
    .default(1),
  take: z
    .preprocess((val) => Number(val), z.number().int().positive())
    .optional()
    .default(10),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userEmail, page, take } = getEventTypeQuerySchema.parse(req.query);

    const eventTypes = await prisma.user.findMany({
      where: {
        email: userEmail,
      },
      take: take,
      skip: (page - 1) * take,
      include: {
        eventTypes: true,
      },
    });

    const mappedEventTypes = eventTypes.map((item) => {
      return {
        userId: item.id,
        userEmail: item.email,
        eventTypes: item.eventTypes,
        page: page,
        take: take,
      };
    });
    return mappedEventTypes;
  } catch (error) {
    return error;
  }
}

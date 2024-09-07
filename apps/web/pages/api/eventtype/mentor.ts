import type { NextApiRequest, NextApiResponse } from "next/types";
import { z } from "zod";

import prisma from "@calcom/prisma";

export const getEventTypeQuerySchema = z.object({
  email: z.string().optional(),
  page: z
    .preprocess((val) => Number(val), z.number().int().positive())
    .optional()
    .default(1),
  take: z
    .preprocess((val) => Number(val), z.number().int().positive())
    .optional()
    .default(10),
});

async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, page, take } = getEventTypeQuerySchema.parse(req.query);

    const eventTypes = await prisma.user.findMany({
      where: {
        email: email,
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
        eventTypes: item.eventTypes.map((eventType) => {
          return {
            id: eventType.id,
            title: eventType.title,
            description: eventType.description,
            length: eventType.length,
            slug: eventType.slug,
            eventName: eventType.eventName,
          };
        }),
        page: page,
        take: take,
      };
    });
    return mappedEventTypes;
  } catch (error) {
    return error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const result = await GET(req, res);
    return res.status(200).json(result);
  } else {
    return res.status(405).end();
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const getMentorsSchema = z
    .object({
      startTime: z.date().or(z.string()).optional(),
      endTime: z.date().or(z.string()).optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

  const { startTime, endTime, take, skip } = getMentorsSchema.parse(req.query);

  if (req.method === "GET") {
    const parsedStartTime = new Date(startTime as string);
    const parsedEndTime = new Date(endTime as string);

    const selectedUsers = await prisma.user.findMany({
      where: {
        schedules: {
          some: {
            availability: {
              some: {
                OR: [
                  ...(startTime
                    ? [
                        {
                          startTime: {
                            lte: parsedStartTime,
                          },
                          endTime: {
                            gte: parsedStartTime,
                          },
                        },
                      ]
                    : []),
                  ...(endTime
                    ? [
                        {
                          startTime: {
                            lte: parsedEndTime,
                          },
                          endTime: {
                            gte: parsedEndTime,
                          },
                        },
                      ]
                    : []),
                ].filter(Boolean),
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        schedules: {
          select: {
            availability: {
              select: {
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
      take,
      skip,
    });

    res.status(200).json({
      mentors: selectedUsers,
      message: "Get Mentors by Availability Successful",
    });
  }
}

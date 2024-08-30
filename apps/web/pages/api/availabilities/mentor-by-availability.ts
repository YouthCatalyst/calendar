import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const getMentorsSchema = z
      .object({
        startTime: z.date().or(z.string()).optional(),
        endTime: z.date().or(z.string()).optional(),
        take: z.number().optional(),
        skip: z.number().optional(),
      })
      .strict();

    const { startTime, endTime, take, skip } = getMentorsSchema.parse(req.query);
    const parsedStartTime = new Date(startTime as string);
    const parsedEndTime = new Date(endTime as string);

    // adjusting day index (start from saturday with 0)
    let startDay = parsedStartTime.getDay() - 1;
    let endDay = parsedEndTime.getDay() - 1;

    // edge case for saturday
    if (startDay === -1) startDay = 6;
    if (endDay === -1) endDay = 6;

    // change date format to 1970-1-1
    const startDate = Date.UTC(1970, 0, 1, parsedStartTime.getUTCHours(), parsedStartTime.getUTCMinutes());
    const endDate = Date.UTC(1970, 0, 1, parsedEndTime.getUTCHours(), parsedEndTime.getUTCMinutes());

    const selectedUsers = await prisma.user.findMany({
      where: {
        schedules: {
          // check if the schedule name is flashcampus mentoring
          some: {
            name: {
              equals: "Flashcampus Mentoring",
            },
            availability: {
              some: {
                // check if the desired day is exist in the schedule availabilites
                days: {
                  hasSome: [startDay, endDay],
                },
                // check if desired time is in the time range
                OR: [
                  ...(startTime
                    ? [
                        {
                          startTime: {
                            lte: new Date(startDate),
                          },
                          endTime: {
                            gte: new Date(startDate),
                          },
                        },
                      ]
                    : []),
                  ...(endTime
                    ? [
                        {
                          startTime: {
                            lte: new Date(endDate),
                          },
                          endTime: {
                            gte: new Date(endDate),
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

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { getUsersAvailability } from "@calcom/core/getUserAvailability";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const getMentorsSchema = z
      .object({
        startTime: z.string(),
        endTime: z.string(),
        take: z.string().optional(),
        skip: z.string().optional(),
      })
      .strict();

    const { startTime, endTime, take, skip } = getMentorsSchema.parse(req.query);

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    // adjusting day index (start from saturday with 0)
    let startDay = parsedStartTime.getDay() - 1;
    let endDay = parsedEndTime.getDay() - 1;

    // edge case for saturday
    if (startDay === -1) startDay = 6;
    if (endDay === -1) endDay = 6;

    // change date format to 1970-1-1
    const startDateUTC = Date.UTC(1970, 0, 1, parsedStartTime.getUTCHours(), parsedStartTime.getUTCMinutes());
    const endDateUTC = Date.UTC(1970, 0, 1, parsedEndTime.getUTCHours(), parsedEndTime.getUTCMinutes());

    const selectedUsers = await prisma.user.findMany({
      where: {
        schedules: {
          some: {
            name: {
              equals: "Flashcampus Mentoring",
            },
            availability: {
              some: {
                days: {
                  hasSome: [startDay, endDay],
                },
                OR: [
                  ...(startTime
                    ? [
                        {
                          startTime: {
                            lte: new Date(startDateUTC),
                          },
                          endTime: {
                            gte: new Date(startDateUTC),
                          },
                        },
                      ]
                    : []),
                  ...(endTime
                    ? [
                        {
                          startTime: {
                            lte: new Date(endDateUTC),
                          },
                          endTime: {
                            gte: new Date(endDateUTC),
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
      take: Number(take),
      skip: Number(skip),
    });

    const allUsersAvailability = (
      await getUsersAvailability({
        users: selectedUsers,
        query: {
          dateFrom: startTime,
          dateTo: endTime,
          returnDateOverrides: true,
        },
      })
    ).map(({ busy, dateRanges, oooExcludedDateRanges, timeZone, datesOutOfOffice }, index) => {
      const currentUser = selectedUsers[index];
      return {
        timeZone,
        dateRanges,
        oooExcludedDateRanges,
        busy,
        user: currentUser,
        datesOutOfOffice,
      };
    });

    res.status(200).json({
      mentors: allUsersAvailability,
      message: "Get Mentors by Availability Successful",
    });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { getUsersAvailability } from "@calcom/core/getUserAvailability";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const getMentorsSchema = z
    .object({
      startTime: z.date().or(z.string()),
      endTime: z.date().or(z.string()),
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
      },
      take,
      skip,
    });

    console.log(selectedUsers);

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

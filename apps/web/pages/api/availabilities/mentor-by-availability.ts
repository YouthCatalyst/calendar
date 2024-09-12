import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { getUsersAvailability } from "@calcom/core/getUserAvailability";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const getMentorsSchema = z
    .object({
      startTime: z.string(),
      endTime: z.string(),
      take: z.coerce.number().optional().default(10),
      skip: z.coerce.number().optional().default(0),
    })
    .strict();

  const { startTime, endTime, take, skip } = getMentorsSchema.parse(req.query);

  if (req.method === "GET") {
    const selectedUsers = await prisma.user.findMany({
      where: {
        emailVerified: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const allUsersAvailability = await getUsersAvailability({
      users: selectedUsers,
      query: {
        dateFrom: startTime,
        dateTo: endTime,
        returnDateOverrides: true,
      },
    });

    const payload = allUsersAvailability
      .map(({ busy, dateRanges, oooExcludedDateRanges, timeZone, datesOutOfOffice }, index) => {
        const currentUser = selectedUsers[index];

        if (dateRanges.length == 0) return null;

        return {
          timeZone,
          dateRanges,
          oooExcludedDateRanges,
          busy,
          user: currentUser,
          datesOutOfOffice,
        };
      })
      .filter((item) => item !== null);

    const response = payload.slice(skip, skip + take);

    res.status(200).json({
      mentors: response,
      message: "Get Mentors by Availability Successful",
    });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { getUsersAvailability } from "@calcom/core/getUserAvailability";
import prisma, { availabilityUserSelect } from "@calcom/prisma";
import { credentialForCalendarServiceSelect } from "@calcom/prisma/selects/credential";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const getMentorsSchema = z
    .object({
      startTime: z.string(),
      endTime: z.string(),
      mentorsId: z.union([z.string(), z.array(z.string())]).transform((ids) => {
        return Array.isArray(ids) ? ids : [ids];
      }),
    })
    .strict();

  const { startTime, endTime, mentorsId } = getMentorsSchema.parse(req.query);

  if (req.method === "GET") {
    const selectedUsers = await prisma.user.findMany({
      where: {
        emailVerified: {
          not: null,
        },
        email: {
          in: mentorsId,
        },
      },
      select: {
        ...availabilityUserSelect,
        credentials: {
          select: credentialForCalendarServiceSelect,
        },
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

    res.status(200).json({
      mentors: payload,
      message: "Get Mentors by Availability Successful",
    });
  }
}

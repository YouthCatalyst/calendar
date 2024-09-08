import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { getUsersAvailability } from "@calcom/core/getUserAvailability";
import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const getMentorsSchema = z
    .object({
      startTime: z.string(),
      endTime: z.string(),
      mentorsId: z.array(z.string()),
    })
    .strict();

  const { startTime, endTime, mentorsId } = getMentorsSchema.parse(req.query);

  if (req.method === "GET") {
    console.log("hai kawan", mentorsId);
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
        id: true,
        name: true,
        email: true,
      },
    });

    console.log("fetchUsers: ", selectedUsers);

    const allUsersAvailability = await getUsersAvailability({
      users: selectedUsers,
      query: {
        dateFrom: startTime,
        dateTo: endTime,
        returnDateOverrides: true,
      },
    });

    console.log("Users availability: ", allUsersAvailability);

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

    console.log("final result: ", payload);

    res.status(200).json({
      mentors: payload,
      message: "Get Mentors by Availability Successful",
    });
  }
}

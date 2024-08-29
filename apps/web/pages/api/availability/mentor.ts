import type { NextApiResponse } from "next";
import type { NextApiRequest } from "next/types";
import { z } from "zod";

import prisma from "@calcom/prisma";

const getMentorAvailabilityQuerySchema = z.object({
  email: z.string().email(),
  startTime: z.date().or(z.string()).optional(),
  endTime: z.date().or(z.string()).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, startTime, endTime } = getMentorAvailabilityQuerySchema.parse(req.query);

  if (req.method === "GET") {
    try {
      const parsedStartTime = new Date(startTime as string);
      const parsedEndTime = new Date(endTime as string);

      const selectQuery = {
        select: {
          schedules: {
            select: {
              availability:
                startTime || endTime
                  ? {
                      where: {
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
                    }
                  : true,
            },
          },
        },
      };

      const selectedUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
        ...selectQuery,
      });

      const mappedResponse = selectedUser?.schedules
        .map((schedule) => {
          return schedule.availability;
        })
        .flat();

      res.status(200).json({
        availabilites: mappedResponse,
        message: "Mentor availability fetched successfully",
      });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

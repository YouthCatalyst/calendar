import type { NextApiRequest, NextApiResponse } from "next";

import prisma from "@calcom/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query } = req;

  if (req.method === "GET") {
    const selectedUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        availability: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    // If startTime more than query.startTime and endTime less than query.endTime
    const filteredUsers = selectedUsers.filter((user) => {
      const availability = user.availability;

      // If neither query.startTime nor query.endTime is provided, return true (include the user)
      if (!query.startTime && !query.endTime) {
        return true;
      }

      return availability.some((time) => {
        // Convert availability times and query times to Date objects
        const startTime = new Date(time.startTime);
        const endTime = new Date(time.endTime);
        const queryStartTime = query.startTime ? new Date(query.startTime as string) : null;
        const queryEndTime = query.endTime ? new Date(query.endTime as string) : null;

        // Apply the filter based on the provided query times
        return (
          !queryStartTime ||
          startTime >= queryStartTime || // Check if startTime is greater than or equal to queryStartTime
          !queryEndTime ||
          endTime <= queryEndTime // Check if endTime is less than or equal to queryEndTime
        );
      });
    });

    res.status(200).json({
      availability: filteredUsers,
      message: "Get Mentors by Availability Successful",
    });
  }
}

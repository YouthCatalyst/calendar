import type { NextApiRequest } from "next";

import { HttpError } from "@calcom/lib/http-error";
import { defaultResponder } from "@calcom/lib/server";
import prisma from "@calcom/prisma";

import {
  schemaAvailabilityCreateBodyParams,
  schemaAvailabilityEditBodyParams,
} from "~/lib/validations/availability";
import { schemaUserReadPublic } from "~/lib/validations/user";

async function getHandler(req: NextApiRequest) {
  const {
    body,
    pagination: { take, skip },
  } = req;

  const { startTime, endTime } = schemaAvailabilityEditBodyParams.parse(body);

  await checkPermissions(req);

  const selectedUsers = await prisma.user.findMany({
    where: {
      availability: {
        every: {
          startTime,
          endTime,
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

  req.statusCode = 201;
  return {
    availability: schemaUserReadPublic.parse(selectedUsers),
    message: "Get Mentors by Availability Successful",
  };
}

async function checkPermissions(req: NextApiRequest) {
  const { userId, isSystemWideAdmin } = req;
  if (isSystemWideAdmin) return;
  const data = schemaAvailabilityCreateBodyParams.parse(req.body);
  const schedule = await prisma.schedule.findFirst({
    where: { userId, id: data.scheduleId },
  });
  if (!schedule)
    throw new HttpError({ statusCode: 401, message: "You can't get mentors by this availability" });
}

export default defaultResponder(getHandler);

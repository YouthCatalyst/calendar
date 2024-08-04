import { sendInviteMentorEmail } from "@calcom/emails";
import { getTranslation } from "@calcom/lib/server/i18n";
import { prisma } from "@calcom/prisma";

import type { TrpcSessionUser } from "../../../trpc";
import type { TActivateUserSchema } from "./activateUnverifiedUser.schema";

type GetOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TActivateUserSchema;
};

const ActivateUserHandler = async ({ input }: GetOptions) => {
  const { userId } = input;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      name: true,
      email: true,
      locale: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: {
      email: user.email,
    },
    data: {
      // update the email to the IdP email
      email: user.email,
      emailVerified: new Date(Date.now()),
    },
  });

  const t = await getTranslation(user.locale ?? "en", "common");

  const activateLink = `${process.env.NEXT_PUBLIC_WEBAPP_URL}`;
  await sendInviteMentorEmail({
    language: t,
    user: {
      name: user.name,
      email: user.email,
    },
    activateLink,
  });

  return {
    success: true,
    userId: userId,
  };
};

export default ActivateUserHandler;

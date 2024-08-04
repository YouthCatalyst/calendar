import type { NextApiRequest, NextApiResponse } from "next";

import { hashPassword } from "@calcom/features/auth/lib/hashPassword";
import { sendEmailVerification } from "@calcom/features/auth/lib/verifyEmail";
import notEmpty from "@calcom/lib/notEmpty";
import { generateUsernameSuggestion } from "@calcom/lib/server/username";
import { validateAndGetCorrectedUsernameAndEmail } from "@calcom/lib/validateUsername";
import prisma from "@calcom/prisma";
import { IdentityProvider } from "@calcom/prisma/enums";
import { registerMentorSchema } from "@calcom/prisma/zod-utils";

import { prefillAvatar } from "../utils/prefillAvatar";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = req.body;
  const { mentorName, email, password, language, token } = registerMentorSchema.parse(data);

  const userEmail = email.toLowerCase();
  const username = userEmail.split("@")[0];
  let hashedPassword;
  let correctedUsername = username;

  const userValidation = await validateAndGetCorrectedUsernameAndEmail({
    username,
    email: userEmail,
    isSignup: true,
  });

  if (!userValidation.isValid) {
    if (userValidation.email) {
      return res.status(409).json({ message: "Email is already taken" });
    }

    // get list of similar usernames in the db
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
        },
      },
      select: {
        username: true,
      },
    });

    // generate randomized username
    correctedUsername = await generateUsernameSuggestion(
      users.map((user) => user.username).filter(notEmpty),
      username
    );
  }
  if (!userValidation.username) {
    return res.status(422).json({ message: "Invalid username" });
  }

  if (password) {
    hashedPassword = await hashPassword(password);
  } else {
    hashedPassword = await hashPassword("");
  }

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      name: mentorName,
      username: correctedUsername,
      email: userEmail,
      password: { create: { hash: hashedPassword } },
      identityProvider: IdentityProvider.CAL,
      completedOnboarding: false,
      locale: language ? language : "en",
    },
  });

  if (process.env.AVATARAPI_USERNAME && process.env.AVATARAPI_PASSWORD) {
    await prefillAvatar({ email: userEmail });
  }

  await sendEmailVerification({
    email: userEmail,
    username: correctedUsername,
    language,
  });

  res.status(201).json({ message: "Mentor registered" });
}

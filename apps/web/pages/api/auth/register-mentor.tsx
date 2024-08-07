import type { NextApiRequest, NextApiResponse } from "next";

import registerUnverifiedMentorHandler from "@calcom/feature-auth/signup/handlers/registerUnverifiedMentorHandler";
import getIP from "@calcom/lib/getIP";
import { HttpError } from "@calcom/lib/http-error";
import logger from "@calcom/lib/logger";
import { checkCfTurnstileToken } from "@calcom/lib/server/checkCfTurnstileToken";

function ensureReqIsPost(req: NextApiRequest) {
  if (req.method !== "POST") {
    throw new HttpError({
      statusCode: 405,
      message: "Method not allowed",
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const remoteIp = getIP(req);
  // Use a try catch instead of returning res every time
  try {
    await checkCfTurnstileToken({
      token: req.headers["cf-access-token"] as string,
      remoteIp,
    });

    ensureReqIsPost(req);

    return await registerUnverifiedMentorHandler(req, res);
  } catch (e) {
    if (e instanceof HttpError) {
      return res.status(e.statusCode).json({ message: e.message });
    }
    logger.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
}
